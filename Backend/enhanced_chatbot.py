#!/usr/bin/env python3
"""
Enhanced Chatbot with Improved Flow
Flow: User Input -> Internet Check -> RAG (Top 10) -> LLM Brain -> Response
"""

import sys
import json
import argparse
import pickle
import time
import os
import requests
import socket
import html
import re
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
METADATA_PATH = os.path.join(BASE_DIR, "metadata.pkl")
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
TOP_K = 10  # Exactly 10 elements from RAG
RELEVANCE_THRESHOLD = 0.15
INTERNET_TIMEOUT = 3

# Global caches
_METADATA_CACHE = None
_VECTORIZER_CACHE = None
_CORPUS_EMBEDDINGS_CACHE = None

os.makedirs(SESSIONS_DIR, exist_ok=True)

def aggressive_clean_html(text: str) -> str:
    """Aggressively clean all HTML entities"""
    if not text:
        return text
    
    # Multiple passes to ensure all entities are decoded
    for _ in range(5):
        text = html.unescape(text)
    
    # Manual cleanup for stubborn entities that html.unescape might miss
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")
    text = text.replace('&#x27;', "'")
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&nbsp;', ' ')
    
    return text

class EnhancedChatbot:
    """Enhanced chatbot with the requested flow"""
    
    def __init__(self):
        self.session_data = {}
        
    def check_internet(self) -> Dict[str, Any]:
        """Step 1: Check internet connectivity"""
        try:
            socket.create_connection(("8.8.8.8", 53), timeout=INTERNET_TIMEOUT)
            return {'available': True, 'status': 'Connected', 'check_time': time.time()}
        except OSError:
            try:
                socket.create_connection(("1.1.1.1", 53), timeout=INTERNET_TIMEOUT)
                return {'available': True, 'status': 'Connected (fallback)', 'check_time': time.time()}
            except OSError:
                return {'available': False, 'status': 'No internet connection', 'check_time': time.time()}
    
    def load_knowledge_base(self):
        """Load the RAG knowledge base"""
        global _METADATA_CACHE, _VECTORIZER_CACHE, _CORPUS_EMBEDDINGS_CACHE
        
        if _METADATA_CACHE is not None:
            return _METADATA_CACHE, _VECTORIZER_CACHE, _CORPUS_EMBEDDINGS_CACHE
        
        try:
            with open(METADATA_PATH, "rb") as f:
                raw_metadata = pickle.load(f)
            
            metadata = []
            for entry in raw_metadata:
                q = entry.get("question") or entry.get("query") or entry.get("text") or ""
                a = entry.get("answer") or entry.get("ans") or entry.get("response") or ""
                if q and a and len(q) > 10 and len(a) > 20:
                    # Clean HTML entities from metadata
                    metadata.append({"question": aggressive_clean_html(q), "answer": aggressive_clean_html(a)})
            
            corpus = [entry["question"] for entry in metadata]
            vectorizer = TfidfVectorizer(max_features=3000, stop_words='english', ngram_range=(1, 3))
            corpus_embeddings = vectorizer.fit_transform(corpus)
            
            _METADATA_CACHE = metadata
            _VECTORIZER_CACHE = vectorizer
            _CORPUS_EMBEDDINGS_CACHE = corpus_embeddings
            
            return metadata, vectorizer, corpus_embeddings
            
        except Exception:
            return [], None, None
    
    def get_top_10_from_rag(self, query: str) -> List[Dict]:
        """Step 2: Get exactly top 10 elements from RAG"""
        metadata, vectorizer, corpus_embeddings = self.load_knowledge_base()
        
        if not metadata or vectorizer is None:
            return []
        
        try:
            query_processed = query.lower()
            banking_expansions = {
                'password': 'password reset change login security',
                'account': 'account balance banking services',
                'transfer': 'transfer money send wire payment',
                'card': 'card credit debit activate payment',
                'loan': 'loan mortgage credit application',
                'atm': 'atm cash withdraw deposit machine'
            }
            
            for term, expansion in banking_expansions.items():
                if term in query_processed:
                    query_processed += f' {expansion}'
            
            query_vec = vectorizer.transform([query_processed])
            similarities = cosine_similarity(query_vec, corpus_embeddings).flatten()
            top_indices = np.argsort(similarities)[::-1][:TOP_K]
            
            top_10_docs = []
            for i, idx in enumerate(top_indices):
                score = similarities[idx]
                if score >= RELEVANCE_THRESHOLD:
                    top_10_docs.append({
                        'rank': i + 1,
                        'question': metadata[idx]['question'],
                        'answer': metadata[idx]['answer'],
                        'score': float(score),
                        'relevance': 'high' if score > 0.5 else 'medium' if score > 0.3 else 'low'
                    })
            
            return top_10_docs
            
        except Exception:
            return []
    
    def load_chat_history(self, session_id: str) -> List[Dict]:
        """Load full chat history for the session"""
        session_file = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        try:
            if os.path.exists(session_file):
                with open(session_file, 'r', encoding='utf-8') as f:
                    return json.load(f).get('messages', [])
        except Exception:
            pass
        return []
    
    def save_chat_history(self, session_id: str, messages: List[Dict]):
        """Save chat history"""
        session_file = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        try:
            with open(session_file, 'w', encoding='utf-8') as f:
                json.dump({'session_id': session_id, 'messages': messages, 'last_updated': time.time()}, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
    
    def call_llm_brain(self, prompt: str) -> str:
        """Step 3: Use LLM as the brain to process information"""
        from dotenv import load_dotenv
        load_dotenv()
        
        api_key = os.getenv('AZURE_OPENAI_API_KEY')
        endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')
        
        if not api_key or not endpoint or not deployment:
            return None
        
        try:
            url = f"{endpoint}openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview"
            headers = {'Content-Type': 'application/json', 'api-key': api_key}
            payload = {"messages": [{"role": "user", "content": prompt}], "max_tokens": 500, "temperature": 0.7}
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                cleaned = aggressive_clean_html(content)
                return cleaned
            else:
                return None
                
        except Exception:
            return None
    
    def check_pdf_mode(self, session_id: str) -> Tuple[bool, Dict[str, str]]:
        """Check if session is in PDF Q&A mode"""
        try:
            pdf_state_file = os.path.join(SESSIONS_DIR, f"{session_id}_pdf_state.json")
            if os.path.exists(pdf_state_file):
                with open(pdf_state_file, 'r', encoding='utf-8') as f:
                    pdf_data = json.load(f)
                    return True, {'filename': pdf_data.get('filename', ''), 'content': pdf_data.get('extracted_text', '')}
        except Exception:
            pass
        return False, {}
    
    def is_banking_related_query(self, query: str) -> bool:
        """Check if query is banking-related"""
        banking_terms = ['account', 'balance', 'name', 'address', 'phone', 'email', 'number', 'bank', 'banking', 'deposit', 'withdrawal', 'transfer', 'payment', 'card', 'credit', 'debit', 'loan', 'mortgage', 'interest', 'fee', 'branch', 'atm', 'transaction', 'statement', 'kyc', 'pan', 'aadhar', 'passport', 'income', 'employer', 'occupation', 'savings', 'checking', 'routing', 'swift', 'ifsc', 'customer', 'holder', 'beneficiary']
        return any(term in query.lower() for term in banking_terms)
    
    def query_pdf_content(self, query: str, pdf_content: str, filename: str) -> Tuple[str, float]:
        """Query PDF content directly"""
        if not pdf_content:
            return "No PDF content available to search.", 0.0
        if not self.is_banking_related_query(query):
            return "I'm a banking assistant and can only help with banking-related questions about your uploaded document.", 0.1
        
        # Extract information using regex patterns
        import re
        query_lower = query.lower()
        
        if 'account' in query_lower:
            match = re.search(r'account\s*(?:number|no\.?|#)?\s*:?\s*([0-9-]{8,20})', pdf_content, re.IGNORECASE)
            if match:
                return f"Based on your uploaded document ({filename}), your account number is: {match.group(1)}", 0.95
        
        return f"I couldn't find specific information about '{query}' in your uploaded document ({filename}).", 0.3
    
    def process_query(self, user_input: str, session_id: str = "default") -> Dict[str, Any]:
        """Main processing flow"""
        start_time = time.time()
        
        is_pdf_mode, pdf_data = self.check_pdf_mode(session_id)
        if is_pdf_mode and pdf_data.get('content'):
            response, confidence = self.query_pdf_content(user_input, pdf_data['content'], pdf_data['filename'])
            return {'response': aggressive_clean_html(response), 'internet_status': {'available': True}, 'rag_results': 1, 'llm_used': False, 'processing_time': time.time() - start_time, 'pdf_mode': True}
        
        internet_status = self.check_internet()
        if not user_input or not user_input.strip():
            return {'response': "Hello! How can I help you with your banking needs today?", 'internet_status': internet_status, 'processing_time': time.time() - start_time}
        
        top_10_rag = self.get_top_10_from_rag(user_input)
        if not top_10_rag:
            return {'response': "I'm sorry, I couldn't find relevant information for your query.", 'internet_status': internet_status, 'rag_results': 0, 'llm_used': False, 'processing_time': time.time() - start_time}
        
        chat_history = self.load_chat_history(session_id)
        
        llm_prompt = f"""You are a helpful banking assistant. Answer the user's question using the provided knowledge sources.

USER QUESTION: {user_input}

TOP 10 RELEVANT KNOWLEDGE SOURCES:
"""
        for doc in top_10_rag:
            llm_prompt += f"{doc['rank']}. Q: {doc['question']}\\nA: {doc['answer']}\\n\\n"
        
        llm_prompt += """
INSTRUCTIONS:
- Use the knowledge sources to provide accurate information
- Provide complete, step-by-step instructions when appropriate
- Be conversational and helpful

Response:"""
        
        llm_response = self.call_llm_brain(llm_prompt)
        
        if llm_response and len(llm_response.strip()) > 10:
            final_response = aggressive_clean_html(llm_response.strip())
        else:
            final_response = aggressive_clean_html(f"Based on our knowledge base: {top_10_rag[0]['answer']}")
        
        chat_history.append({'role': 'user', 'content': user_input, 'timestamp': time.time()})
        chat_history.append({'role': 'assistant', 'content': final_response, 'timestamp': time.time()})
        self.save_chat_history(session_id, chat_history)
        
        return {
            'response': final_response,
            'internet_status': internet_status,
            'rag_results': len(top_10_rag),
            'llm_used': llm_response is not None,
            'processing_time': time.time() - start_time
        }

def main():
    parser = argparse.ArgumentParser(description='Enhanced Chatbot')
    parser.add_argument('--query', required=True, help='User query')
    parser.add_argument('--session-id', default='default', help='Session ID')
    args = parser.parse_args()
    
    try:
        chatbot = EnhancedChatbot()
        result = chatbot.process_query(args.query, args.session_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print(json.dumps({"response": "Technical difficulties.", "error": str(e), "processing_time": 0}, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
