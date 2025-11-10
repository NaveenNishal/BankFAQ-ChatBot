import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import json
import os
from datetime import datetime
from offline_translator import OfflineTranslator
import re

class MultilingualBankingBot:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.documents = []
        self.document_vectors = None
        self.translator = OfflineTranslator()
        self.supported_languages = {
            'en': 'English',
            'es': 'Spanish', 
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic'
        }
        
        # Escalation triggers
        self.escalation_keywords = [
            'complaint', 'angry', 'frustrated', 'terrible', 'awful', 'horrible',
            'lawsuit', 'legal', 'attorney', 'fraud', 'scam', 'stolen',
            'emergency', 'urgent', 'immediate', 'crisis', 'help me',
            'manager', 'supervisor', 'speak to human', 'representative',
            'cancel account', 'close account', 'dispute', 'error'
        ]
        
        self.complex_queries = [
            'loan application', 'mortgage', 'investment', 'financial planning',
            'tax advice', 'business account', 'wire transfer', 'international',
            'credit report', 'bankruptcy', 'foreclosure', 'refinance'
        ]
        
        self.load_knowledge_base()
        self.load_api_key()
    
    def load_knowledge_base(self):
        try:
            with open('metadata.pkl', 'rb') as f:
                data = pickle.load(f)
                self.documents = [item['answer'] for item in data]
                self.questions = [item['question'] for item in data]
                self.document_vectors = self.vectorizer.fit_transform(self.documents)
        except FileNotFoundError:
            self.documents = []
            self.questions = []
    
    def load_api_key(self):
        # Load Azure OpenAI credentials
        self.azure_api_key = os.getenv('AZURE_OPENAI_API_KEY', '')
        self.azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT', '')
        self.azure_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt4o')
    
    def detect_language(self, text):
        """Detect the language of input text"""
        try:
            return self.translator.detect_language(text)
        except:
            return 'en'
    
    def translate_text(self, text, target_lang='en', source_lang='auto'):
        """Translate text using Azure OpenAI"""
        if source_lang == target_lang:
            return text
            
        # Use Azure OpenAI for accurate translations
        if self.azure_api_key:
            try:
                language_names = {
                    'es': 'Spanish', 'fr': 'French', 'de': 'German', 'zh': 'Chinese',
                    'it': 'Italian', 'pt': 'Portuguese', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'en': 'English'
                }
                target_name = language_names.get(target_lang, target_lang)
                source_name = language_names.get(source_lang, source_lang) if source_lang != 'auto' else 'the source language'
                
                prompt = f"""Translate this text from {source_name} to {target_name}. 
Provide ONLY the natural, fluent translation without any explanations, quotes, or additional text.
Maintain the original meaning and tone.

Text to translate: {text}

Translation:"""
                
                headers = {
                    'api-key': self.azure_api_key,
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 150,
                    "temperature": 0.3
                }
                
                url = f"{self.azure_endpoint}openai/deployments/{self.azure_deployment}/chat/completions?api-version=2024-02-15-preview"
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    translated = result['choices'][0]['message']['content'].strip()
                    translated = translated.strip('"\'')
                    
                    import html
                    for _ in range(3):
                        translated = html.unescape(translated)
                    
                    return translated
            except Exception:
                pass
        
        return text
    
    def detect_escalation(self, query, user_lang='en'):
        """Detect if query needs human escalation"""
        query_lower = query.lower()
        
        # Translate escalation keywords to user's language for better detection
        escalation_score = 0
        
        # Check for escalation keywords
        for keyword in self.escalation_keywords:
            if user_lang != 'en':
                translated_keyword = self.translate_text(keyword, target_lang=user_lang).lower()
                if translated_keyword in query_lower:
                    escalation_score += 2
            if keyword in query_lower:
                escalation_score += 2
        
        # Check for complex queries
        for complex_term in self.complex_queries:
            if user_lang != 'en':
                translated_term = self.translate_text(complex_term, target_lang=user_lang).lower()
                if translated_term in query_lower:
                    escalation_score += 1
            if complex_term in query_lower:
                escalation_score += 1
        
        # Check for repeated questions (frustration indicator)
        if '?' in query and query.count('?') > 2:
            escalation_score += 1
        
        # Check for caps (anger indicator)
        if len([c for c in query if c.isupper()]) > len(query) * 0.5:
            escalation_score += 2
        
        # Determine escalation level
        if escalation_score >= 4:
            return "high", "Immediate human intervention required"
        elif escalation_score >= 2:
            return "medium", "Consider human handoff"
        else:
            return "low", "Can be handled by AI"
    
    def get_rag_response(self, query, top_k=10):
        if not self.documents:
            return "I don't have access to banking information right now."
        
        query_vector = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, self.document_vectors).flatten()
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        # Lower threshold for multilingual queries
        if similarities[top_indices[0]] < 0.03:
            return "I don't have specific information about that banking topic."
        
        relevant_docs = [self.documents[i] for i in top_indices if similarities[i] > 0.03]
        return " ".join(relevant_docs[:5])
    
    def call_llm_api(self, prompt, user_language='en'):
        if not self.azure_api_key:
            return None
        
        # Add language context to prompt
        if user_language != 'en':
            language_names = {
                'es': 'Spanish', 'fr': 'French', 'de': 'German', 'zh': 'Chinese',
                'it': 'Italian', 'pt': 'Portuguese', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic'
            }
            lang_name = language_names.get(user_language, 'the user\'s language')
            prompt = f"Please respond in {lang_name}. {prompt}"
        
        headers = {
            'api-key': self.azure_api_key,
            'Content-Type': 'application/json'
        }
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
            "temperature": 0.3
        }
        
        try:
            url = f"{self.azure_endpoint}openai/deployments/{self.azure_deployment}/chat/completions?api-version=2024-02-15-preview"
            response = requests.post(url, headers=headers, json=payload, timeout=8)
            
            if response.status_code == 200:
                result = response.json()
                llm_response = result['choices'][0]['message']['content'].strip()
                # CRITICAL: Clean HTML entities from LLM response immediately
                import html
                for _ in range(5):
                    llm_response = html.unescape(llm_response)
                return llm_response
        except Exception:
            pass
        return None
    
    def process_query(self, query, user_lang='en', session_id='default'):
        """Process multilingual query using EnhancedChatbot + translation"""
        if not user_lang:
            user_lang = 'en'
        
        # Translate query to English
        english_query = query if user_lang == 'en' else self.translate_text(query, target_lang='en', source_lang=user_lang)
        
        # Use EnhancedChatbot for processing
        from enhanced_chatbot import EnhancedChatbot
        chatbot = EnhancedChatbot()
        result = chatbot.process_query(english_query, session_id)
        
        # Clean HTML entities from English response first
        import html
        clean_response = result['response']
        for _ in range(3):
            clean_response = html.unescape(clean_response)
        
        # Translate cleaned response back to user's language
        if user_lang != 'en':
            translated_response = self.call_llm_api(
                f"Translate this banking response to {user_lang}. Keep all banking terms accurate. Return plain text with proper quotes and apostrophes, NOT HTML entities like &quot; or &#39;:\n\n{clean_response}",
                user_lang
            )
            if not translated_response:
                translated_response = self.translate_text(clean_response, target_lang=user_lang, source_lang='en')
            
            # CRITICAL: Clean HTML entities from translated response (LLM sometimes returns them)
            if translated_response:
                for _ in range(5):  # Multiple passes to handle nested encoding
                    translated_response = html.unescape(translated_response)
        else:
            translated_response = clean_response
        
        return {
            'response': translated_response,
            'escalation': False,
            'escalation_level': 'low',
            'escalation_reason': 'Handled by AI',
            'language': user_lang,
            'original_query': query,
            'english_query': english_query
        }

# FastAPI Integration
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Multilingual Banking Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = MultilingualBankingBot()

class QueryRequest(BaseModel):
    query: str
    language: str = None

class QueryResponse(BaseModel):
    response: str
    escalation: bool
    escalation_level: str
    escalation_reason: str
    language: str
    supported_languages: dict

@app.post("/chat", response_model=QueryResponse)
async def chat_endpoint(request: QueryRequest):
    try:
        result = bot.process_query(request.query, request.language)
        
        return QueryResponse(
            response=result['response'],
            escalation=result['escalation'],
            escalation_level=result['escalation_level'],
            escalation_reason=result['escalation_reason'],
            language=result['language'],
            supported_languages=bot.supported_languages
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/languages")
async def get_supported_languages():
    return {"supported_languages": bot.supported_languages}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "features": ["multilingual", "escalation_detection"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)