import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService as CoreChatService, ChatMessage, ChatResponse } from '../core/services/chat.service';
import { TranslationService } from '../core/services/translation.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;
  currentLanguage = 'en';
  supportedLanguages: { [key: string]: string } = {};

  constructor(
    private chatService: CoreChatService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.currentLanguage = 'en'; // Default to English
    this.loadSupportedLanguages();
    this.addWelcomeMessage();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      content: this.getWelcomeMessage(),
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
  }
  
  getWelcomeMessage(): string {
    const messages = {
      en: 'Hello! I\'m your Banking Assistant. I can help with banking questions in multiple languages. How can I assist you today?',
      es: '¡Hola! Soy tu Asistente Bancario. Puedo ayudarte con preguntas bancarias en múltiples idiomas. ¿Cómo puedo asistirte hoy?',
      fr: 'Bonjour! Je suis votre Assistant Bancaire. Je peux vous aider avec des questions bancaires en plusieurs langues. Comment puis-je vous aider aujourd\'hui?',
      de: 'Hallo! Ich bin Ihr Banking-Assistent. Ich kann bei Bankfragen in mehreren Sprachen helfen. Wie kann ich Ihnen heute helfen?',
      zh: '您好！我是您的银行助手。我可以用多种语言帮助您解答银行问题。今天我可以为您做些什么？'
    };
    return messages[this.currentLanguage as keyof typeof messages] || messages.en;
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping) return;

    // Add user message
    const userMessage: ChatMessage = {
      content: this.currentMessage,
      isUser: true,
      timestamp: new Date(),
      language: this.currentLanguage
    };
    this.messages.push(userMessage);

    const query = this.currentMessage;
    this.currentMessage = '';
    this.isTyping = true;

    this.chatService.sendMessage(query, this.currentLanguage).subscribe({
      next: (response: ChatResponse) => {
        this.isTyping = false;
        
        const botMessage: ChatMessage = {
          content: this.decodeHtmlEntities(response.response),
          isUser: false,
          timestamp: new Date(),
          language: this.currentLanguage, // Use selected language
          escalation: response.escalation,
          escalationLevel: response.escalation_level
        };
        
        this.messages.push(botMessage);
        
        // Trigger escalation modal if needed
        if (response.escalation && response.escalation_level === 'high') {
          this.translationService.triggerEscalation();
        }
      },
      error: (error) => {
        this.isTyping = false;
        
        const errorMessage: ChatMessage = {
          content: 'Technical error occurred. Please try again.',
          isUser: false,
          timestamp: new Date(),
          escalation: true
        };
        
        this.messages.push(errorMessage);
      }
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  loadSupportedLanguages() {
    // Use predefined supported languages
    this.supportedLanguages = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'zh': '中文',
      'it': 'Italiano',
      'pt': 'Português',
      'ja': '日本語',
      'ko': '한국어',
      'ar': 'العربية'
    };
  }
  
  changeLanguage(event: any) {
    const language = event.target ? event.target.value : event;
    this.currentLanguage = language;
    this.translationService.setLanguage(language);
    
    // Update welcome message in new language
    this.messages = [];
    this.addWelcomeMessage();
  }
  
  getEscalationClass(level?: string): string {
    switch(level) {
      case 'high': return 'escalation-high';
      case 'medium': return 'escalation-medium';
      case 'low': return 'escalation-low';
      default: return '';
    }
  }
  
  getTranslation(key: string): string {
    return this.translationService.getTranslation(key);
  }
  
  Object = Object;
  
  getLanguageOptions() {
    return Object.keys(this.supportedLanguages);
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  private decodeHtmlEntities(text: string): string {
    if (!text) return '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    let decoded = doc.documentElement.textContent || text;
    
    // Additional cleanup for common HTML entities
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    return decoded;
  }
}