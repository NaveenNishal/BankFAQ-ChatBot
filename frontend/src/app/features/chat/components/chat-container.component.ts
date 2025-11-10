import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../../shared/ui/button.component';
import { PdfUploadComponent } from './pdf-upload.component';
import { EscalationButtonsComponent } from './escalation-buttons.component';
import { AutoEscalationService } from '../services/auto-escalation.service';
import { AuthService } from '../../auth/services/auth.service';
import { ChatStateService, ChatMessage } from '../../../services/chat-state.service';
import { WebSocketService } from '../../../services/websocket.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, PdfUploadComponent, EscalationButtonsComponent],
  template: `
    <div class="chat-container">
      <!-- User Info Bar -->
      <div class="us-card user-info-bar">
        <div class="user-info-content">
          <div class="user-details">
            <i class="bi bi-person-circle" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
            <span class="user-name">{{ currentUser().userName }}</span>
          </div>
          <button 
            (click)="logout()"
            class="us-btn us-btn-secondary us-btn-sm">
            <i class="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </div>
      
      <!-- Chat Container -->
      <div class="us-card chat-main">
            
            <!-- Chat Header -->
            <div class="us-chat-header">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <i class="bi bi-robot me-3" style="color: var(--primary-blue); font-size: 1.5rem;"></i>
                  <div>
                    <h3 class="mb-0">BankFAQ Bot</h3>
                    <p class="mb-0" style="color: var(--text-secondary);">Get answers to banking questions</p>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                  <!-- Language Selector -->
                  <div class="language-selector">
                    <select class="form-select form-select-sm" 
                            [(ngModel)]="currentLanguage" 
                            (change)="changeLanguage($event)">
                      <option *ngFor="let lang of getLanguageOptions()" 
                              [value]="lang">
                        {{ supportedLanguages[lang] }}
                      </option>
                    </select>
                  </div>
                  <div class="d-flex align-items-center px-3 py-2 rounded-pill" 
                       style="background: rgba(40, 167, 69, 0.1);">
                    <span class="status-online"></span>
                    <span class="fw-medium" style="color: var(--success-green); font-size: 0.875rem;">Online</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div class="us-chat-messages">
              
              <div *ngFor="let message of messages$ | async" class="fade-in">
                
                <!-- User Message -->
                <div *ngIf="message.isUser" class="d-flex justify-content-end mb-3">
                  <div class="us-chat-bubble us-chat-bubble-user">
                    <div style="white-space: pre-wrap;">{{ message.content }}</div>
                    <div class="us-chat-timestamp">{{ message.timestamp | date:'short' }}</div>
                  </div>
                </div>

                <!-- Bot Message -->
                <div *ngIf="!message.isUser" class="d-flex justify-content-start mb-3">
                  <div style="max-width: 75%;">
                    
                    <!-- Escalation Alert -->
                    <div *ngIf="message.escalated" class="alert alert-danger py-2 px-3 mb-2 border-0 rounded-3" 
                         style="background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%);">
                      <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                        <small class="fw-medium text-danger">Transferred to Customer Service</small>
                      </div>
                    </div>

                    <div [class]="message.escalated ? 'us-chat-bubble us-chat-bubble-escalated' : 'us-chat-bubble us-chat-bubble-bot'">
                      <div [innerHTML]="formatMarkdown(message.content)" style="white-space: pre-wrap;"></div>
                      <div class="us-chat-timestamp">{{ message.timestamp | date:'short' }}</div>
                      
                      <!-- Feedback Buttons -->
                      <div class="feedback-buttons" *ngIf="!message.escalated && !message.feedbackGiven">
                        <button (click)="giveFeedback(message.id, 'like')" class="feedback-btn like-btn" title="Helpful">
                          <i class="bi bi-hand-thumbs-up"></i>
                        </button>
                        <button (click)="giveFeedback(message.id, 'dislike')" class="feedback-btn dislike-btn" title="Not helpful">
                          <i class="bi bi-hand-thumbs-down"></i>
                        </button>
                      </div>
                      
                      <!-- Feedback Given -->
                      <div class="feedback-given" *ngIf="message.feedbackGiven">
                        <span [class]="message.feedback === 'like' ? 'feedback-like' : 'feedback-dislike'">
                          <i class="bi" [class]="message.feedback === 'like' ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-down-fill'"></i>
                          {{ message.feedback === 'like' ? 'Helpful' : 'Not helpful' }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Escalation Buttons -->
                    <app-escalation-buttons 
                      *ngIf="!message.escalated && !chatDisabled() && !isInLiveChat() && isLastBotMessage(message)"
                      (satisfied)="onSatisfied(message.id)"
                      (escalate)="onEscalateToLive()">
                    </app-escalation-buttons>
                  </div>
                </div>
              </div>

              <!-- Typing Indicator -->
              <div *ngIf="isTyping()" class="d-flex justify-content-start mb-3 fade-in">
                <div class="us-chat-bubble us-chat-bubble-bot typing-indicator">
                  <div class="d-flex align-items-center">
                    <div class="typing-dots me-3">
                      <div class="typing-dot"></div>
                      <div class="typing-dot"></div>
                      <div class="typing-dot"></div>
                    </div>
                    <small class="text-muted fw-medium">Assistant is thinking...</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="us-chat-input">
              
              <!-- Auto-Escalation Notification -->
              <div *ngIf="showEscalationNotification()" class="mb-3">
                <div class="alert alert-info py-2 px-3 border-0 rounded-3" 
                     style="background: linear-gradient(135deg, rgba(13, 202, 240, 0.1) 0%, rgba(13, 202, 240, 0.05) 100%);">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-info-circle-fill text-info me-2"></i>
                    <small class="fw-medium text-info">{{ escalationNotificationMessage() }}</small>
                  </div>
                </div>
              </div>

              <div class="input-row">
                <div class="input-field">
                  <textarea 
                    [(ngModel)]="currentMessage"
                    (keydown.enter)="onKeyDown($any($event))"
                    [disabled]="isTyping() || chatDisabled()"
                    [placeholder]="chatDisabled() ? 'Chat transferred to customer service' : 'Ask about account types, fees, services, branch hours, or banking policies...'"
                    class="us-input"
                    rows="2"
                    style="resize: none; width: 100%;">
                  </textarea>
                </div>
                <app-pdf-upload 
                  [sessionId]="sessionId"
                  (uploadComplete)="onPdfUploadComplete($event)"
                  (uploadError)="onPdfUploadError($event)">
                </app-pdf-upload>
                <button 
                  (click)="sendMessage()"
                  [disabled]="!currentMessage.trim() || isTyping() || chatDisabled()"
                  class="us-btn us-btn-primary send-button">
                  <i class="bi bi-send-fill" style="font-size: 1.25rem;"></i>
                </button>
              </div>
              
              <!-- Security Notice -->
              <div class="text-center mt-3">
                <small class="text-muted d-flex align-items-center justify-content-center">
                  <i class="bi bi-shield-check me-2" style="color: var(--success-green);"></i>
                  Secure FAQ system • Instant answers • 24/7 available
                </small>
              </div>
            </div>
          </div>
    </div>
  `,
  styles: [`
    /* U.S. Bank Chat Component Styles */
    :host {
      display: block;
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .chat-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .user-info-bar {
      padding: 1rem;
    }
    
    .user-info-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .user-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .user-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .chat-main {
      padding: 0;
      overflow: hidden;
    }
    
    .us-chat-header {
      padding: var(--space-4);
      background: #ffffff;
      border-bottom: 1px solid var(--border-light);
    }
    
    .us-chat-messages {
      padding: 1.5rem;
      min-height: 400px;
      max-height: 500px;
      overflow-y: auto;
      background: #f8f9fa;
      border-bottom: 1px solid var(--border-light);
    }
    
    .us-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .us-chat-messages::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    .us-chat-messages::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    .us-chat-bubble {
      padding: var(--space-3);
      border-radius: 12px;
      max-width: 75%;
      word-wrap: break-word;
    }
    
    .us-chat-bubble-user {
      background: var(--primary-blue);
      color: white;
      margin-left: auto;
    }
    
    .us-chat-bubble-bot {
      background: #e9ecef;
      color: var(--text-primary);
    }
    
    .us-chat-bubble-escalated {
      background: var(--action-red);
      color: white;
    }
    
    .us-chat-timestamp {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-top: var(--space-1);
    }
    
    .us-chat-input {
      padding: 1.5rem;
      border-top: 1px solid var(--border-light);
      background: #ffffff;
    }
    
    .input-row {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
    }
    
    .input-field {
      flex: 1;
    }
    
    .send-button {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .status-online {
      width: 8px;
      height: 8px;
      background: var(--success-green);
      border-radius: 50%;
      margin-right: var(--space-1);
    }
    
    .typing-dots {
      display: flex;
      gap: 4px;
    }
    
    .typing-dot {
      width: 6px;
      height: 6px;
      background: var(--text-secondary);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    
    .fade-in {
      animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .feedback-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .feedback-btn {
      background: none;
      border: 1px solid #ddd;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.8rem;
    }
    
    .feedback-btn:hover {
      transform: scale(1.1);
    }
    
    .like-btn:hover {
      background: #28a745;
      color: white;
      border-color: #28a745;
    }
    
    .dislike-btn:hover {
      background: #dc3545;
      color: white;
      border-color: #dc3545;
    }
    
    .feedback-given {
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }
    
    .feedback-like {
      color: #28a745;
    }
    
    .feedback-dislike {
      color: #dc3545;
    }
    
    .language-selector {
      min-width: 120px;
    }
    
    .language-selector .form-select {
      border: 1px solid #dee2e6;
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class ChatContainerComponent {
  private http = inject(HttpClient);
  
  messages$ = this.chatStateService.messages$;
  currentMessage = '';
  isTyping = signal(false);
  showEscalationNotification = signal(false);
  escalationNotificationMessage = signal('');
  sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  dislikeStreak = 0;
  chatDisabled = signal(false);
  isInLiveChat = signal(false);
  currentServiceRequestId = signal<string | null>(null);
  private sessionPdfContent: {filename?: string, content?: string} = {};
  
  // Language support
  currentLanguage = 'en';
  supportedLanguages: { [key: string]: string } = {
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

  constructor(
    public autoEscalationService: AutoEscalationService,
    public authService: AuthService,
    private chatStateService: ChatStateService,
    private webSocketService: WebSocketService
  ) {
    // Generate unique session ID for STATELESS session
    const userId = this.authService.currentAuth().userId || 'anonymous';
    const timestamp = Date.now();
    this.sessionId = `${userId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔄 NEW STATELESS SESSION: ${this.sessionId}`);
    console.log('✅ User will start with completely fresh conversation history');
    
    this.initializeFreshSession();
  }

  initializeFreshSession() {
    // STATELESS SESSION: Always start completely fresh
    this.chatStateService.clearChat();
    this.dislikeStreak = 0;
    this.chatDisabled.set(false);
    this.showEscalationNotification.set(false);
    
    // Clear backend session memory to ensure no previous context
    this.clearBackendSession();
    
    // Add welcome message for new session
    this.addWelcomeMessage();
    
    console.log('✅ Fresh session initialized - no previous conversation history loaded');
  }

  clearBackendSession() {
    // CRITICAL: Clear backend session memory to ensure stateless experience
    const clearRequest = {
      sessionId: this.sessionId
    };
    
    this.http.post(`${environment.apiUrl}/api/v1/clear-session`, clearRequest).subscribe({
      next: (result) => {
        console.log('✅ Backend session cleared - guaranteed fresh start:', result);
      },
      error: (err) => {
        console.warn('⚠️ Failed to clear backend session:', err);
      }
    });
  }

  get currentUser() {
    return this.authService.currentAuth;
  }

  logout() {
    // Archive current session for admin review before logout
    this.archiveCurrentSession('logout');
    
    // Clear frontend state
    this.chatStateService.clearChat();
    
    // Logout user
    this.authService.logout();
  }

  archiveCurrentSession(reason: string = 'session_end') {
    const currentMessages = this.chatStateService.getMessages();
    
    // Only archive if there are actual conversation messages (not just welcome)
    const conversationMessages = currentMessages.filter(msg => 
      msg.id !== 'welcome' && (msg.isUser || !msg.content.includes('Hello! I\'m your SecureChat'))
    );
    
    if (conversationMessages.length > 0) {
      const archiveRequest = {
        sessionId: this.sessionId,
        userId: this.currentUser().userId,
        reason: reason
      };
      
      this.http.post(`${environment.apiUrl}/api/v1/archive-session`, archiveRequest).subscribe({
        next: (result) => {
          console.log('📁 Session archived for admin review:', result);
        },
        error: (err) => {
          console.warn('⚠️ Failed to archive session:', err);
        }
      });
    }
  }

  addWelcomeMessage() {
    const welcomeMessages = {
      en: 'Hello! I\'m the BankFAQ Assistant. I can help answer questions about banking services, account types, fees, branch locations, and general banking information. What would you like to know?',
      es: '¡Hola! Soy el Asistente BankFAQ. Puedo ayudarte con preguntas sobre servicios bancarios, tipos de cuentas, tarifas, ubicaciones de sucursales e información bancaria general. ¿Qué te gustaría saber?',
      fr: 'Bonjour! Je suis l\'Assistant BankFAQ. Je peux vous aider avec des questions sur les services bancaires, les types de comptes, les frais, les emplacements des succursales et les informations bancaires générales. Que souhaitez-vous savoir?',
      de: 'Hallo! Ich bin der BankFAQ-Assistent. Ich kann bei Fragen zu Bankdienstleistungen, Kontotypen, Gebühren, Filialstandorten und allgemeinen Bankinformationen helfen. Was möchten Sie wissen?',
      zh: '您好！我是BankFAQ助手。我可以帮助您解答有关银行服务、账户类型、费用、分行位置和一般银行信息的问题。您想了解什么？'
    };
    
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: welcomeMessages[this.currentLanguage as keyof typeof welcomeMessages] || welcomeMessages.en,
      isUser: false,
      timestamp: new Date(),
      escalated: false,
      confidenceLevel: 'HIGH',
      confidenceScore: 0.95
    };
    this.chatStateService.addMessage(welcomeMessage);
  }

  async handleAutoEscalation(ragResponse: any, userMessage: string) {
    const chatHistory = this.chatStateService.getMessages();
    
    if (this.autoEscalationService.shouldEscalate(ragResponse, userMessage, chatHistory)) {
      try {
        // Create service request via backend API
        const serviceRequestData = {
          customerId: this.currentUser().userId,
          customerName: this.currentUser().userName,
          customerEmail: this.currentUser().email,
          chatHistory: chatHistory,
          escalationReason: ragResponse.reason || 'auto_escalated',
          priority: ragResponse.risk_type === 'fraud' ? 'critical' : 'high',
          pdfExtractedText: this.sessionPdfContent.content || localStorage.getItem('lastPdfExtraction'),
          pdfFilename: this.sessionPdfContent.filename || localStorage.getItem('lastPdfFilename')
        };

        const response = await this.http.post<{success: boolean, serviceRequestId: string}>(`${environment.apiUrl}/api/service-requests`, serviceRequestData).toPromise();
        
        if (response?.success) {
          const escalationMessage = this.autoEscalationService.getEscalationMessage({ ragResponse });
          
          // Show notification
          this.escalationNotificationMessage.set(
            `Service Request ${response.serviceRequestId.slice(-8)} created. A specialist will contact you shortly.`
          );
          this.showEscalationNotification.set(true);
          
          // Hide notification after 10 seconds
          setTimeout(() => {
            this.showEscalationNotification.set(false);
          }, 10000);
          
          return escalationMessage;
        }
      } catch (error) {
        console.error('Auto-escalation failed:', error);
        return null;
      }
    }
    
    return null;
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping()) return;

    const userMessage: ChatMessage = {
      id: 'user_' + Date.now(),
      content: this.currentMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    this.chatStateService.addMessage(userMessage);

    const query = this.currentMessage;
    this.currentMessage = '';
    this.isTyping.set(true);

    const request = {
      query,
      userId: this.currentUser().userId,
      sessionId: this.sessionId,
      language: this.currentLanguage
    };

    // If in live chat, send via WebSocket with translation
    if (this.isInLiveChat()) {
      const requestId = this.currentServiceRequestId();
      if (requestId && this.currentLanguage !== 'en') {
        this.http.post(`${environment.apiUrl}/api/v1/translate-message`, {
          message: query,
          sourceLang: this.currentLanguage,
          targetLang: 'en',
          serviceRequestId: requestId
        }).subscribe({
          next: (result: any) => {
            this.webSocketService.sendMessage(result.translatedMessage || query);
          },
          error: () => this.webSocketService.sendMessage(query)
        });
      } else {
        this.webSocketService.sendMessage(query);
      }
      this.isTyping.set(false);
      return;
    }
    
    this.http.post<any>(`${environment.apiUrl}/api/v1/chat`, request).subscribe({
      next: async (response) => {
        this.isTyping.set(false);
        
        // Check for auto-escalation only with valid response
        const escalationMessage = await this.handleAutoEscalation(response, query);
        
        const botMessage: ChatMessage = {
          id: response.queryId || 'bot_' + Date.now(),
          content: escalationMessage || response.response,
          isUser: false,
          timestamp: new Date(response.timestamp || Date.now()),
          escalated: response.escalated || !!escalationMessage,
          confidenceScore: response.confidenceScore,
          confidenceLevel: response.confidenceLevel
        };
        
        this.chatStateService.addMessage(botMessage);
        this.autoEscalationService.updateConversationHistory(this.chatStateService.getMessages());
        
        // If escalated, archive session for admin review
        if (botMessage.escalated) {
          this.archiveCurrentSession('escalation');
        }
      },
      error: () => {
        this.isTyping.set(false);
        
        const errorMessage: ChatMessage = {
          id: 'error_' + Date.now(),
          content: 'I\'m experiencing technical difficulties. Please try again or visit our help center for immediate assistance.',
          isUser: false,
          timestamp: new Date(),
          escalated: false
        };
        
        this.chatStateService.addMessage(errorMessage);
        // Don't call handleAutoEscalation on API errors
      }
    });
  }

  onKeyDown(event: any) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onPdfUploadComplete(event: {filename: string, chunksCreated: number, extractedPreview?: string, fullText?: string}) {
    // Store full extracted text for admin access
    const extractedText = event.fullText || event.extractedPreview;
    if (extractedText) {
      localStorage.setItem(`pdf_extracted_${event.filename}`, extractedText);
      localStorage.setItem('lastPdfExtraction', extractedText);
      localStorage.setItem('lastPdfFilename', event.filename);
      
      // Store in session for service requests
      this.sessionPdfContent = {
        filename: event.filename,
        content: extractedText
      };
      
      console.log('=== PDF EXTRACTED CONTENT ===');
      console.log('Filename:', event.filename);
      console.log('Chunks:', event.chunksCreated);
      console.log('Preview:', event.extractedPreview);
      console.log('💾 STORAGE VERIFICATION:');
      console.log('  Stored in localStorage:', !!localStorage.getItem('lastPdfExtraction'));
      console.log('  Content length:', extractedText.length);
      console.log('  Full text available:', !!event.fullText);
      console.log('  Session PDF stored:', !!this.sessionPdfContent.content);
      console.log('=== END EXTRACTED CONTENT ===');
    }
    
    const confirmationMessage: ChatMessage = {
      id: 'pdf_upload_' + Date.now(),
      content: `✅ ${event.filename} has been successfully processed (${event.chunksCreated} chunks created). Content stored for admin access. What would you like to know about this document?`,
      isUser: false,
      timestamp: new Date(),
      escalated: false,
      confidenceLevel: 'HIGH',
      confidenceScore: 1.0
    };
    this.chatStateService.addMessage(confirmationMessage);
  }

  onPdfUploadError(error: string) {
    const errorMessage: ChatMessage = {
      id: 'pdf_error_' + Date.now(),
      content: `❌ PDF upload failed: ${error}`,
      isUser: false,
      timestamp: new Date(),
      escalated: true
    };
    this.chatStateService.addMessage(errorMessage);
  }

  getConfidenceClass(level?: string): string {
    switch(level) {
      case 'HIGH': return 'confidence-high';
      case 'MEDIUM': return 'confidence-medium';
      case 'LOW': return 'confidence-low';
      default: return 'confidence-medium';
    }
  }

  giveFeedback(messageId: string, feedback: 'like' | 'dislike') {
    // Update message with feedback
    this.chatStateService.updateMessage(messageId, { feedbackGiven: true, feedback });

    // Handle dislike streak
    if (feedback === 'like') {
      this.dislikeStreak = 0;
    } else {
      this.dislikeStreak++;
      
      if (this.dislikeStreak >= 3) {
        this.triggerFeedbackEscalation();
      }
    }
  }

  async triggerFeedbackEscalation() {
    try {
      // Create service request via backend API
      const serviceRequestData = {
        customerId: this.currentUser().userId,
        customerName: this.currentUser().userName,
        customerEmail: this.currentUser().email,
        chatHistory: this.chatStateService.getMessages(),
        escalationReason: 'feedback_based_escalation',
        priority: 'high',
        pdfExtractedText: this.sessionPdfContent.content || localStorage.getItem('lastPdfExtraction'),
        pdfFilename: this.sessionPdfContent.filename || localStorage.getItem('lastPdfFilename')
      };

      this.http.post<{success: boolean, serviceRequestId: string}>(`${environment.apiUrl}/api/service-requests`, serviceRequestData).subscribe({
        next: (response) => {
          if (response.success) {
            // Add escalation message
            const escalationMessage: ChatMessage = {
              id: 'escalation_' + Date.now(),
              content: `I couldn\'t find the answer to your question. I\'ve created a support ticket (ID: ${response.serviceRequestId.slice(-8)}) and our customer service team will help you within 24 hours.`,
              isUser: false,
              timestamp: new Date(),
              escalated: true
            };

            this.chatStateService.addMessage(escalationMessage);
            
            // Disable chat and archive session
            this.chatDisabled.set(true);
            this.archiveCurrentSession('feedback_escalation');
          }
        },
        error: (error) => {
          console.error('Feedback escalation failed:', error);
        }
      });
      
    } catch (error) {
      console.error('Feedback escalation failed:', error);
    }
  }
  
  changeLanguage(event: any) {
    const language = event.target ? event.target.value : event;
    this.currentLanguage = language;
    
    // Update welcome message in new language
    this.chatStateService.clearChat();
    this.addWelcomeMessage();
  }
  
  getLanguageOptions() {
    return Object.keys(this.supportedLanguages);
  }

  isLastBotMessage(message: ChatMessage): boolean {
    const messages = this.chatStateService.getMessages();
    const botMessages = messages.filter(m => !m.isUser);
    return botMessages.length > 0 && botMessages[botMessages.length - 1].id === message.id;
  }

  onSatisfied(messageId: string) {
    // Just hide the buttons, no further action needed
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  async onEscalateToLive() {
    try {
      // Create service request
      const serviceRequestData = {
        customerId: this.currentUser().userId,
        customerName: this.currentUser().userName,
        customerEmail: this.currentUser().email,
        chatHistory: this.chatStateService.getMessages(),
        escalationReason: 'live_agent_requested',
        priority: 'high',
        pdfExtractedText: this.sessionPdfContent.content,
        pdfFilename: this.sessionPdfContent.filename
      };

      const response = await this.http.post<{success: boolean, serviceRequestId: string}>(`${environment.apiUrl}/api/service-requests`, serviceRequestData).toPromise();
      
      if (response?.success) {
        this.currentServiceRequestId.set(response.serviceRequestId);
        this.isInLiveChat.set(true);
        this.chatDisabled.set(true);
        localStorage.setItem(`live_chat_lang_${response.serviceRequestId}`, this.currentLanguage);
        
        // Add connecting message in user's language
        const connectingMessages = {
          en: 'Connecting you to a live agent. Please wait a moment...',
          es: 'Conectándote con un agente en vivo. Por favor espera un momento...',
          fr: 'Connexion à un agent en direct. Veuillez patienter un instant...',
          de: 'Verbindung zu einem Live-Agenten. Bitte warten Sie einen Moment...',
          zh: '正在连接到在线客服。请稍候...',
          it: 'Connessione a un agente dal vivo. Attendere un momento...',
          pt: 'Conectando você a um agente ao vivo. Por favor, aguarde um momento...',
          ja: 'ライブエージェントに接続しています。しばらくお待ちください...',
          ko: '실시간 상담원에 연결 중입니다. 잠시만 기다려주세요...',
          ar: 'جارٍ الاتصال بوكيل مباشر. يرجى الانتظار لحظة...'
        };
        const connectingMessage: ChatMessage = {
          id: 'connecting_' + Date.now(),
          content: connectingMessages[this.currentLanguage as keyof typeof connectingMessages] || connectingMessages.en,
          isUser: false,
          timestamp: new Date(),
          escalated: false
        };
        this.chatStateService.addMessage(connectingMessage);
        
        // Connect to WebSocket
        this.webSocketService.connect(response.serviceRequestId, 'customer');
        
        // Listen for live chat messages
        this.webSocketService.messages$.subscribe(message => {
          // Enable chat when first admin message arrives
          if (message.sender === 'admin' && this.chatDisabled()) {
            this.chatDisabled.set(false);
            const messages = this.chatStateService.getMessages();
            const connectingMsg = messages.find(m => m.id.startsWith('connecting_'));
            if (connectingMsg) {
              const connectedMessages = {
                en: 'Connected to live agent. You can now chat directly with our support team.',
                es: 'Conectado con un agente en vivo. Ahora puede chatear directamente con nuestro equipo de soporte.',
                fr: 'Connecté à un agent en direct. Vous pouvez maintenant discuter directement avec notre équipe d\'assistance.',
                de: 'Mit einem Live-Agenten verbunden. Sie können jetzt direkt mit unserem Support-Team chatten.',
                zh: '已连接到在线客服。您现在可以直接与我们的支持团队聊天。',
                it: 'Connesso a un agente dal vivo. Ora puoi chattare direttamente con il nostro team di supporto.',
                pt: 'Conectado a um agente ao vivo. Agora você pode conversar diretamente com nossa equipe de suporte.',
                ja: 'ライブエージェントに接続されました。サポートチームと直接チャットできます。',
                ko: '실시간 상담원에 연결되었습니다. 이제 지원팀과 직접 채팅할 수 있습니다.',
                ar: 'متصل بوكيل مباشر. يمكنك الآن الدردشة مباشرة مع فريق الدعم لدينا.'
              };
              this.chatStateService.updateMessage(connectingMsg.id, {
                content: connectedMessages[this.currentLanguage as keyof typeof connectedMessages] || connectedMessages.en
              });
            }
          }
          
          // Translate admin messages to user's language
          if (message.sender === 'admin' && this.currentLanguage !== 'en') {
            this.http.post(`${environment.apiUrl}/api/v1/translate-message`, {
              message: message.content,
              sourceLang: 'en',
              targetLang: this.currentLanguage,
              serviceRequestId: response.serviceRequestId
            }).subscribe({
              next: (result: any) => {
                const chatMessage: ChatMessage = {
                  id: message.id,
                  content: result.translatedMessage || message.content,
                  isUser: false,
                  timestamp: message.timestamp,
                  escalated: false
                };
                this.chatStateService.addMessage(chatMessage);
              },
              error: () => {
                const chatMessage: ChatMessage = {
                  id: message.id,
                  content: message.content,
                  isUser: false,
                  timestamp: message.timestamp,
                  escalated: false
                };
                this.chatStateService.addMessage(chatMessage);
              }
            });
          } else {
            const chatMessage: ChatMessage = {
              id: message.id,
              content: message.content,
              isUser: message.sender === 'customer',
              timestamp: message.timestamp,
              escalated: false
            };
            this.chatStateService.addMessage(chatMessage);
          }
        });
      }
    } catch (error) {
      console.error('Failed to escalate to live agent:', error);
    }
  }
}