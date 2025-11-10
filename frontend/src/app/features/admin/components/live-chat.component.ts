import { Component, EventEmitter, Input, Output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequest } from '../../../shared/models/service-request.models';
import { WebSocketService, LiveChatMessage } from '../../../services/websocket.service';

@Component({
  selector: 'app-live-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="live-chat-modal">
      <div class="live-chat-container">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-info">
            <h5 class="mb-1">Live Chat - {{ request?.customerName }}</h5>
            <small class="text-muted">{{ request?.customerEmail }} • {{ request?.id?.slice(-8) }}</small>
          </div>
          <div class="header-actions">
            <span class="connection-status" [class]="isConnected() ? 'connected' : 'disconnected'">
              <span class="status-dot"></span>
              {{ isConnected() ? 'Connected' : 'Connecting...' }}
            </span>
            <button (click)="endLiveChat()" class="us-btn us-btn-danger us-btn-sm">
              <i class="bi bi-telephone-x"></i>
              End Chat
            </button>
            <button (click)="onClose()" class="us-btn us-btn-secondary us-btn-sm">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Chat History -->
        <div class="chat-messages">
          <!-- Previous AI Chat History -->
          <div class="chat-history-section" *ngIf="request?.chatHistory && (request?.chatHistory?.length || 0) > 0">
            <div class="section-divider">
              <span>Previous Conversation with AI Assistant</span>
            </div>
            <div *ngFor="let message of request?.chatHistory" class="message-wrapper">
              <div *ngIf="message.isUser" class="message user-message">
                <div class="message-content" [innerHTML]="decodeHtml(message.content)"></div>
                <div class="message-time">{{ message.timestamp | date:'short' }}</div>
              </div>
              <div *ngIf="!message.isUser" class="message bot-message">
                <div class="message-content" [innerHTML]="decodeHtml(message.content)"></div>
                <div class="message-time">{{ message.timestamp | date:'short' }}</div>
              </div>
            </div>
          </div>

          <!-- Live Chat Messages -->
          <div class="live-chat-section" *ngIf="liveChatMessages().length > 0">
            <div class="section-divider">
              <span>Live Chat Session</span>
            </div>
            <div *ngFor="let message of liveChatMessages()" class="message-wrapper">
              <div class="message" [class]="message.sender === 'customer' ? 'user-message' : 'admin-message'">
                <div class="message-content" [innerHTML]="decodeHtml(message.content)"></div>
                <div class="message-time">{{ message.timestamp | date:'short' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="chat-input">
          <div class="input-row">
            <textarea 
              [(ngModel)]="currentMessage"
              (keydown.enter)="onKeyDown($any($event))"
              [disabled]="!isConnected()"
              placeholder="Type your message to the customer..."
              class="us-input"
              rows="2">
            </textarea>
            <button 
              (click)="sendMessage()"
              [disabled]="!currentMessage.trim() || !isConnected()"
              class="us-btn us-btn-primary">
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .live-chat-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .live-chat-container {
      background: white;
      border-radius: 12px;
      width: 800px;
      height: 600px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .chat-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .connection-status.connected {
      color: var(--success-green);
    }

    .connection-status.disconnected {
      color: var(--warning-orange);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f8f9fa;
    }

    .section-divider {
      text-align: center;
      margin: 1rem 0;
      position: relative;
    }

    .section-divider span {
      background: #f8f9fa;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-light);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .message-wrapper {
      margin-bottom: 1rem;
    }

    .message {
      max-width: 70%;
      padding: 0.75rem;
      border-radius: 12px;
      margin-bottom: 0.5rem;
    }

    .user-message {
      background: var(--primary-blue);
      color: white;
      margin-left: auto;
    }

    .bot-message {
      background: #e9ecef;
      color: var(--text-primary);
    }

    .admin-message {
      background: var(--success-green);
      color: white;
      margin-left: auto;
    }

    .message-content {
      margin-bottom: 0.25rem;
    }

    .message-time {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .chat-input {
      padding: 1rem;
      border-top: 1px solid var(--border-light);
      background: white;
    }

    .input-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .input-row textarea {
      flex: 1;
      resize: none;
    }
  `]
})
export class LiveChatComponent implements OnInit, OnDestroy {
  @Input() request: ServiceRequest | null = null;
  @Output() close = new EventEmitter<void>();

  currentMessage = '';
  liveChatMessages = signal<LiveChatMessage[]>([]);
  isConnected = signal(false);

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit() {
    if (this.request) {
      this.webSocketService.connect(this.request.id, 'admin');
      
      this.webSocketService.connection$.subscribe(connected => {
        this.isConnected.set(connected);
      });
      
      this.webSocketService.messages$.subscribe(message => {
        const userLang = localStorage.getItem(`live_chat_lang_${this.request!.id}`);
        
        if (message.sender === 'customer' && userLang && userLang !== 'en') {
          fetch('http://localhost:8093/api/v1/translate-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: message.content,
              sourceLang: userLang,
              targetLang: 'en',
              serviceRequestId: this.request!.id
            })
          }).then(res => res.json()).then(result => {
            this.liveChatMessages.update(messages => [...messages, {
              ...message,
              content: result.translatedMessage || message.content
            }]);
          }).catch(() => {
            this.liveChatMessages.update(messages => [...messages, message]);
          });
        } else {
          this.liveChatMessages.update(messages => [...messages, message]);
        }
      });
    }
  }

  ngOnDestroy() {
    this.webSocketService.disconnect();
  }

  sendMessage() {
    if (!this.currentMessage.trim() || !this.isConnected()) return;

    // Create message object for local display
    const message: LiveChatMessage = {
      id: `admin_${Date.now()}`,
      content: this.currentMessage,
      isUser: false,
      timestamp: new Date(),
      sender: 'admin'
    };

    // Add to local messages immediately
    this.liveChatMessages.update(messages => [...messages, message]);

    // Send via WebSocket
    this.webSocketService.sendMessage(this.currentMessage);
    this.currentMessage = '';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  endLiveChat() {
    // Send end chat message to customer
    if (this.isConnected()) {
      this.webSocketService.sendMessage('Live chat session has been ended by the agent. Thank you for contacting us.');
    }
    
    // Close the chat
    setTimeout(() => {
      this.onClose();
    }, 1000);
  }

  onClose() {
    this.close.emit();
  }

  decodeHtml(text: string): string {
    if (!text) return '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    let decoded = doc.documentElement.textContent || text;
    
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