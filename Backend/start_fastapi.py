#!/usr/bin/env python3
"""
FastAPI Server for Banking Chatbot
"""

from fastapi import FastAPI, HTTPException, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import sys
import tempfile
import os
import time
import html
import re
from typing import Optional, Dict, List

def clean_text(text: str) -> str:
    """Remove all HTML entities from text"""
    if not text:
        return text
    for _ in range(3):
        text = html.unescape(text)
    return text

# Dynamic base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
SERVICE_REQUESTS_FILE = os.path.join(BASE_DIR, "service_requests.jsonl")

# Ensure directories exist
os.makedirs(SESSIONS_DIR, exist_ok=True)

# Load Azure OpenAI configuration from .env
from dotenv import load_dotenv
load_dotenv()

if os.getenv('AZURE_OPENAI_API_KEY'):
    print("INFO: Azure OpenAI configured successfully", file=sys.stderr)
else:
    print("WARNING: Azure OpenAI not configured - LLM functionality may be limited", file=sys.stderr)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, service_request_id: str, user_type: str):
        await websocket.accept()
        if service_request_id not in self.active_connections:
            self.active_connections[service_request_id] = {}
        self.active_connections[service_request_id][user_type] = websocket
        
    def disconnect(self, service_request_id: str, user_type: str):
        if service_request_id in self.active_connections:
            if user_type in self.active_connections[service_request_id]:
                del self.active_connections[service_request_id][user_type]
            if not self.active_connections[service_request_id]:
                del self.active_connections[service_request_id]
                
    async def send_message(self, service_request_id: str, message: dict, sender_type: str):
        if service_request_id in self.active_connections:
            target_type = 'admin' if sender_type == 'customer' else 'customer'
            if target_type in self.active_connections[service_request_id]:
                websocket = self.active_connections[service_request_id][target_type]
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    self.disconnect(service_request_id, target_type)

manager = ConnectionManager()

app = FastAPI(title="SecureBank Assistant API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    userId: str = "anonymous"
    sessionId: str = "default"
    language: str = "en"

class ClearSessionRequest(BaseModel):
    sessionId: str

class ArchiveSessionRequest(BaseModel):
    sessionId: str
    userId: str
    reason: str = "logout"

class ServiceRequestCreate(BaseModel):
    customerId: str
    customerName: str
    customerEmail: str
    chatHistory: list
    escalationReason: str = "auto_escalated"
    priority: str = "medium"
    pdfExtractedText: Optional[str] = None
    pdfFilename: Optional[str] = None

class SummaryRequest(BaseModel):
    requestId: str
    chatHistory: list
    pdfContent: Optional[str] = None
    pdfFilename: Optional[str] = None
    customerInfo: dict
    escalationReason: Optional[str] = None
    priority: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    escalated: bool = False
    confidenceLevel: str = "MEDIUM"
    confidenceScore: float = 0.5
    processing_time: float = 0.0
    llm_mode: bool = False
    out_of_scope: bool = False

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Use multilingual bot if language is not English
        if request.language and request.language != 'en':
            sys.path.append(BASE_DIR)
            from multilingual_banking_bot import MultilingualBankingBot
            
            bot = MultilingualBankingBot()
            result = bot.process_query(request.query, request.language, request.sessionId)
            
            return ChatResponse(
                response=clean_text(result['response']),
                escalated=result['escalation'],
                confidenceLevel='HIGH',
                confidenceScore=0.9,
                processing_time=1.0,
                llm_mode=True,
                out_of_scope=False
            )
        
        # Set environment variable for subprocess
        env = os.environ.copy()
        
        # Use enhanced chatbot for better PDF Q&A handling
        try:
            sys.path.append(BASE_DIR)
            from enhanced_chatbot import EnhancedChatbot
            
            chatbot = EnhancedChatbot()
            result = chatbot.process_query(request.query, request.sessionId)
            
            return ChatResponse(
                response=clean_text(result['response']),
                escalated=False,
                confidenceLevel='HIGH' if result.get('pdf_mode') else 'MEDIUM',
                confidenceScore=0.9 if result.get('pdf_mode') else 0.7,
                processing_time=result['processing_time'],
                llm_mode=result['llm_used'],
                out_of_scope=False
            )
        except Exception as e:
            print(f"Enhanced Chatbot Error: {e}", file=sys.stderr)
            # Fallback to production RAG system
            cmd = [
                "python", "rag_with_llm_production.py",
                "--query", request.query,
                "--user-id", request.userId,
                "--session-id", request.sessionId
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=BASE_DIR,
                env=env
            )
            
            if result.returncode == 0:
                response_data = json.loads(result.stdout)
                if 'response' in response_data:
                    response_data['response'] = clean_text(response_data['response'])
                return ChatResponse(**response_data)
            else:
                print(f"RAG Error: {result.stderr}", file=sys.stderr)
                return ChatResponse(
                    response="I'm experiencing technical difficulties. Please try again or contact support.",
                    escalated=True,
                    confidenceLevel="NONE",
                    confidenceScore=0.0
                )
            
    except Exception as e:
        print(f"API Error: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/v1/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), sessionId: str = Form(...)):
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Call PDF processor
            cmd = [
                "python", "pdf_processor_simple.py",
                "--action", "upload",
                "--session-id", sessionId,
                "--filename", file.filename,
                "--pdf-path", temp_file_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=BASE_DIR
            )
            
            if result.returncode == 0:
                response_data = json.loads(result.stdout)
                return {
                    "success": True,
                    "filename": file.filename,
                    "chunksCreated": response_data.get("chunks_created", 0),
                    "extractedPreview": response_data.get("extracted_preview", ""),
                    "fullText": response_data.get("full_text", "")
                }
            else:
                return {
                    "success": False,
                    "error": f"PDF processing failed: {result.stderr}"
                }
                
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/v1/clear-session")
async def clear_session(request: ClearSessionRequest):
    try:
        # Clear session files
        sessions_dir = SESSIONS_DIR
        session_file = os.path.join(sessions_dir, f"{request.sessionId}.json")
        pdf_state_file = os.path.join(sessions_dir, f"{request.sessionId}_pdf_state.json")
        
        # Remove session files if they exist
        for file_path in [session_file, pdf_state_file]:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        print(f"INFO: Session {request.sessionId} cleared - fresh start guaranteed", file=sys.stderr)
        return {"success": True, "message": "Session cleared - fresh start"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/archive-session")
async def archive_session(request: ArchiveSessionRequest):
    """Archive current session for admin review before clearing"""
    try:
        # Call RAG system to archive session
        cmd = [
            "python", "-c", 
            f"""
import sys
import os
BASE_DIR = r'{BASE_DIR}'
sys.path.append(BASE_DIR)
from rag_with_llm_ready import ChatMemory
memory = ChatMemory('{request.sessionId}')
memory.archive_session('{request.userId}')
print('Session archived successfully')
"""
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )
        
        if result.returncode == 0:
            return {"success": True, "message": "Session archived for admin review"}
        else:
            return {"success": False, "error": f"Archive failed: {result.stderr}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/archived-sessions")
async def get_archived_sessions():
    """Get all archived sessions for admin dashboard"""
    try:
        sessions_dir = SESSIONS_DIR
        archived_sessions = []
        
        if os.path.exists(sessions_dir):
            for filename in os.listdir(sessions_dir):
                if filename.endswith('_archive.json'):
                    file_path = os.path.join(sessions_dir, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            session_data = json.load(f)
                            archived_sessions.append(session_data)
                    except Exception as e:
                        print(f"Error reading archive {filename}: {e}", file=sys.stderr)
        
        archived_sessions.sort(key=lambda x: x.get('archived_at', 0), reverse=True)
        return archived_sessions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve archived sessions: {str(e)}")

@app.get("/api/v1/archived-sessions/{session_id}")
async def get_archived_session(session_id: str):
    """Get specific archived session by ID"""
    try:
        sessions_dir = SESSIONS_DIR
        archive_file = os.path.join(sessions_dir, f"{session_id}_archive.json")
        
        if not os.path.exists(archive_file):
            raise HTTPException(status_code=404, detail="Archived session not found")
        
        with open(archive_file, 'r', encoding='utf-8') as f:
            session_data = json.load(f)
        
        return session_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")

@app.delete("/api/v1/archived-sessions/{session_id}")
async def delete_archived_session(session_id: str):
    """Delete archived session (admin only)"""
    try:
        sessions_dir = SESSIONS_DIR
        archive_file = os.path.join(sessions_dir, f"{session_id}_archive.json")
        
        if not os.path.exists(archive_file):
            raise HTTPException(status_code=404, detail="Archived session not found")
        
        os.remove(archive_file)
        return {"success": True, "message": "Archived session deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

@app.post("/api/service-requests")
async def create_service_request(request: ServiceRequestCreate):
    try:
        import uuid
        import time
        
        # Convert to IST timestamp
        import datetime
        ist_now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        timestamp_ms = int(ist_now.timestamp() * 1000)
        
        service_request = {
            "id": str(uuid.uuid4()),
            "customerId": request.customerId,
            "customerName": request.customerName,
            "customerEmail": request.customerEmail,
            "chatHistory": request.chatHistory,
            "escalationReason": request.escalationReason,
            "priority": request.priority,
            "status": "new",
            "timestamp": timestamp_ms,
            "createdAt": timestamp_ms,
            "pdfExtractedText": request.pdfExtractedText,
            "pdfFilename": request.pdfFilename,
            "lastUpdated": timestamp_ms
        }
        
        # Save to persistent storage
        requests_file = SERVICE_REQUESTS_FILE
        with open(requests_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(service_request) + "\n")
        
        return {"success": True, "serviceRequestId": service_request["id"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create service request: {str(e)}")

@app.get("/api/service-requests")
async def get_service_requests():
    try:
        requests_file = SERVICE_REQUESTS_FILE
        service_requests = []
        
        if os.path.exists(requests_file):
            with open(requests_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        service_requests.append(json.loads(line.strip()))
        
        service_requests.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return service_requests
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve service requests: {str(e)}")

class StatusUpdate(BaseModel):
    status: str

@app.patch("/api/service-requests/{request_id}")
async def update_service_request(request_id: str, update: StatusUpdate):
    try:
        requests_file = SERVICE_REQUESTS_FILE
        service_requests = []
        
        if os.path.exists(requests_file):
            with open(requests_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        service_requests.append(json.loads(line.strip()))
        
        updated = False
        for req in service_requests:
            if req["id"] == request_id:
                req["status"] = update.status
                req["lastUpdated"] = int(time.time() * 1000)
                updated = True
                break
        
        if updated:
            with open(requests_file, "w", encoding="utf-8") as f:
                for req in service_requests:
                    f.write(json.dumps(req) + "\n")
            return {"success": True}
        else:
            raise HTTPException(status_code=404, detail="Service request not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update service request: {str(e)}")

class TranslateMessageRequest(BaseModel):
    message: str
    sourceLang: str
    targetLang: str
    serviceRequestId: str

@app.post("/api/v1/translate-message")
async def translate_message(request: TranslateMessageRequest):
    try:
        sys.path.append(BASE_DIR)
        from multilingual_banking_bot import MultilingualBankingBot
        
        bot = MultilingualBankingBot()
        translated = bot.translate_text(request.message, request.targetLang, request.sourceLang)
        
        return {
            "success": True,
            "translatedMessage": translated,
            "originalMessage": request.message,
            "sourceLang": request.sourceLang,
            "targetLang": request.targetLang
        }
    except Exception as e:
        print(f"Translation error: {e}", file=sys.stderr)
        return {
            "success": False,
            "translatedMessage": request.message,
            "error": str(e)
        }

@app.post("/api/v1/generate-summary")
async def generate_summary(request: SummaryRequest):
    """Generate comprehensive summary including chat translation and PDF content"""
    try:
        # Import multilingual bot for translation
        sys.path.append(BASE_DIR)
        from multilingual_banking_bot import MultilingualBankingBot
        
        bot = MultilingualBankingBot()
        
        # Analyze chat messages and translate to English if needed
        english_messages = []
        detected_languages = set()
        
        for msg in request.chatHistory:
            content = msg.get('content', '')
            if not content or len(content.strip()) < 5:
                continue
                
            # Detect language and translate to English
            detected_lang = bot.detect_language(content)
            detected_languages.add(detected_lang)
            
            if detected_lang != 'en':
                english_content = bot.translate_text(content, target_lang='en', source_lang=detected_lang)
            else:
                english_content = content
                
            english_messages.append({
                'role': 'Customer' if msg.get('isUser') else 'Assistant',
                'original': content,
                'english': english_content,
                'timestamp': msg.get('timestamp'),
                'language': detected_lang
            })
        
        # Create conversation summary
        conversation_text = "\n".join([
            f"[{msg['role']}]: {msg['english']}"
            for msg in english_messages
        ])
        
        # Extract key information
        customer_requests = [msg['english'] for msg in english_messages if msg['role'] == 'Customer']
        assistant_responses = [msg['english'] for msg in english_messages if msg['role'] == 'Assistant']
        
        # Analyze PDF content if available
        pdf_summary = ""
        if request.pdfContent:
            pdf_preview = request.pdfContent[:500] + "..." if len(request.pdfContent) > 500 else request.pdfContent
            pdf_summary = f"\n\n=== PDF DOCUMENT ANALYSIS ===\nFilename: {request.pdfFilename or 'Unknown'}\nContent Preview: {pdf_preview}\nDocument Length: {len(request.pdfContent)} characters"
        
        # Generate comprehensive summary using LLM
        summary_prompt = f"""Create a comprehensive customer service summary in English based on this multilingual conversation:

CUSTOMER INFORMATION:
- Name: {request.customerInfo.get('name', 'Unknown')}
- Email: {request.customerInfo.get('email', 'Unknown')}
- ID: {request.customerInfo.get('id', 'Unknown')}
- Priority: {request.priority or 'Medium'}
- Escalation Reason: {request.escalationReason or 'Auto-escalated'}

DETECTED LANGUAGES: {', '.join(detected_languages)}

CONVERSATION (Translated to English):
{conversation_text}{pdf_summary}

Provide a structured summary with these sections:

=== EXECUTIVE SUMMARY ===
[Brief overview of the interaction]

=== CUSTOMER REQUEST ===
[What the customer wanted/needed]

=== KEY INFORMATION ===
[Important details, account numbers, names, etc.]

=== CONVERSATION ANALYSIS ===
[Summary of the dialogue and customer sentiment]

=== PDF DOCUMENT DETAILS ===
[If PDF was uploaded, summarize its contents and relevance]

=== RESOLUTION STATUS ===
[Current status and next steps]

=== ESCALATION ANALYSIS ===
[Why this was escalated and recommended actions]

Keep each section concise but comprehensive."""
        
        # Call LLM for summary generation
        llm_summary = bot.call_llm_api(summary_prompt, 'en')
        
        if llm_summary:
            final_summary = llm_summary
        else:
            # Fallback summary if LLM fails
            final_summary = f"""=== EXECUTIVE SUMMARY ===
Multilingual customer service interaction with {len(english_messages)} messages.
Languages detected: {', '.join(detected_languages)}

=== CUSTOMER REQUEST ===
{customer_requests[0] if customer_requests else 'No clear request identified'}

=== KEY INFORMATION ===
Customer: {request.customerInfo.get('name', 'Unknown')}
Priority: {request.priority or 'Medium'}
PDF Document: {'Yes - ' + (request.pdfFilename or 'Unknown filename') if request.pdfContent else 'No'}

=== CONVERSATION ANALYSIS ===
Total messages: {len(english_messages)}
Customer messages: {len(customer_requests)}
Assistant responses: {len(assistant_responses)}

=== RESOLUTION STATUS ===
Escalated to human agent for further assistance.

=== ESCALATION ANALYSIS ===
Reason: {request.escalationReason or 'Auto-escalated'}
Recommended action: Human review required."""
        
        return {
            "success": True,
            "summary": final_summary,
            "detectedLanguages": list(detected_languages),
            "messageCount": len(english_messages),
            "hasPdfContent": bool(request.pdfContent),
            "generatedAt": int(time.time() * 1000)
        }
        
    except Exception as e:
        print(f"Summary generation error: {e}", file=sys.stderr)
        return {
            "success": False,
            "summary": f"Error generating summary: {str(e)}\n\nPlease review the conversation manually.",
            "error": str(e)
        }

@app.websocket("/ws/chat/{service_request_id}")
async def websocket_endpoint(websocket: WebSocket, service_request_id: str, type: str = None):
    # Get type from query parameter
    if not type:
        query_params = dict(websocket.query_params)
        type = query_params.get('type', 'customer')
    await manager.connect(websocket, service_request_id, type)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message = {
                "id": f"{type}_{int(time.time() * 1000)}",
                "content": message_data["content"],
                "sender": type,
                "timestamp": time.time() * 1000,
                "isUser": type == "customer"
            }
            
            await manager.send_message(service_request_id, message, type)
            
    except WebSocketDisconnect:
        manager.disconnect(service_request_id, type)
    except Exception as e:
        print(f"WebSocket error: {e}", file=sys.stderr)
        manager.disconnect(service_request_id, type)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "service": "SecureBank Assistant API"}

if __name__ == "__main__":
    import uvicorn
    print("Starting SecureBank Assistant API on http://localhost:8093")
    uvicorn.run(app, host="0.0.0.0", port=8093)