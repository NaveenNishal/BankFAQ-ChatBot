import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequest, ChatMessage } from '../../../shared/models/service-request.models';
import { ServiceRequestService } from '../services/service-request.service';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="us-card h-100" *ngIf="request">
      
      <!-- Header -->
      <div class="p-4 border-bottom" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-1 fw-bold" style="color: var(--primary-navy);">
              FAQ Support Request
            </h5>
            <small class="text-muted">{{ request.id }}</small>
          </div>
          <button 
            (click)="onClose()"
            class="us-btn us-btn-secondary us-btn-sm">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <!-- Request Info -->
      <div class="request-info">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer</div>
            <div class="info-value">{{ request.customerName }}</div>
            <div class="info-sub" *ngIf="request.customerEmail">{{ request.customerEmail }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created</div>
            <div class="info-value">{{ getISTDate(request.timestamp) }}</div>
            <div class="info-sub">{{ getISTTime(request.timestamp) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status-badge" [class]="getStatusBadgeClass(request.status)">
                <span class="status-dot"></span>
                {{ request.status | titlecase }}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Priority</div>
            <div class="info-value">
              <span class="priority-badge" [class]="getPriorityBadgeClass(request.priority)">
                {{ (request.priority || 'medium') | titlecase }}
              </span>
            </div>
          </div>
          <div class="info-item" *ngIf="request.escalationSource">
            <div class="info-label">Escalation Source</div>
            <div class="info-value">
              <i class="bi bi-cpu me-1" *ngIf="request.escalationSource === 'rag_system'"></i>
              <i class="bi bi-chat-dots me-1" *ngIf="request.escalationSource === 'frontend_analysis'"></i>
              <i class="bi bi-hand-index me-1" *ngIf="request.escalationSource === 'manual'"></i>
              {{ getEscalationSourceLabel(request.escalationSource) }}
            </div>
          </div>
          <div class="info-item" *ngIf="request.escalationReason">
            <div class="info-label">Escalation Reason</div>
            <div class="info-value">{{ request.escalationReason }}</div>
          </div>
        </div>
        
        <!-- RAG Data Section -->
        <div *ngIf="request.ragData" class="mt-4 p-3 rounded-3" style="background: rgba(13, 202, 240, 0.05); border: 1px solid rgba(13, 202, 240, 0.2);">
          <h6 class="fw-bold mb-2" style="color: var(--primary-navy);">
            <i class="bi bi-cpu me-2"></i>
            RAG System Data
          </h6>
          <div class="row g-2 small">
            <div class="col-md-4" *ngIf="request.ragData.confidenceLevel">
              <strong>Confidence Level:</strong> {{ request.ragData.confidenceLevel }}
            </div>
            <div class="col-md-4" *ngIf="request.ragData.confidenceScore">
              <strong>Confidence Score:</strong> {{ (request.ragData.confidenceScore * 100) | number:'1.1-1' }}%
            </div>
            <div class="col-md-4" *ngIf="request.ragData.retrieved_docs">
              <strong>Retrieved Docs:</strong> {{ request.ragData.retrieved_docs }}
            </div>
            <div class="col-12" *ngIf="request.ragData.reason">
              <strong>RAG Reason:</strong> {{ request.ragData.reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat History -->
      <div class="chat-section">
        <div class="section-header">
          <i class="bi bi-chat-dots"></i>
          <h6>Chat History</h6>
          <span class="message-count">{{ request.chatHistory.length }} messages</span>
        </div>
        <div class="chat-messages">
        
        <div *ngFor="let message of request.chatHistory" class="mb-3">
          
          <!-- User Message -->
          <div *ngIf="message.isUser" class="d-flex justify-content-end">
            <div class="chat-bubble chat-bubble-user" style="max-width: 80%;">
              <div class="fw-medium" [innerHTML]="decodeHtml(message.content)"></div>
              <div class="chat-timestamp text-white-50">{{ getISTTimestamp(message.timestamp) }}</div>
            </div>
          </div>

          <!-- Bot Message -->
          <div *ngIf="!message.isUser" class="d-flex justify-content-start">
            <div style="max-width: 80%;">
              
              <!-- Escalation Alert -->
              <div *ngIf="message.escalated" class="alert alert-danger py-2 px-3 mb-2 border-0 rounded-3" 
                   style="background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%);">
                <div class="d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                  <small class="fw-medium text-danger">Escalated Response</small>
                </div>
              </div>

              <div [class]="message.escalated ? 'chat-bubble chat-bubble-escalated' : 'chat-bubble chat-bubble-bot'">
                <div class="fw-medium mb-2" [innerHTML]="decodeHtml(message.content)"></div>
                
                <div class="chat-timestamp">{{ getISTTimestamp(message.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PDF Content Section -->
      <div class="pdf-section" *ngIf="hasPdfContent()">
        <div class="section-header">
          <i class="bi bi-file-earmark-pdf"></i>
          <h6>PDF Document</h6>
          <span class="pdf-indicator">{{ getPdfFilename() }}</span>
        </div>
        <div class="pdf-actions">
          <button (click)="togglePdfContent()" class="action-btn secondary">
            <i class="bi bi-eye" *ngIf="!showPdfContent()"></i>
            <i class="bi bi-eye-slash" *ngIf="showPdfContent()"></i>
            {{ showPdfContent() ? 'Hide PDF Content' : 'View PDF Content' }}
          </button>
        </div>
        <div class="pdf-content" *ngIf="showPdfContent()">
          <div class="pdf-text">{{ getPdfContent() }}</div>
          <div class="pdf-meta">
            <small class="text-muted">
              <i class="bi bi-info-circle"></i> Extracted from uploaded PDF document
            </small>
          </div>
        </div>
      </div>

      <!-- Chat Summary -->
      <div class="summary-section">
        <div class="section-header">
          <i class="bi bi-chat-square-text"></i>
          <h6>Chat Summary</h6>
        </div>
        <div class="summary-actions">
          <button (click)="generateChatSummary()" class="action-btn primary" [disabled]="isGeneratingSummary()">
            <i class="bi bi-magic" *ngIf="!isGeneratingSummary()"></i>
            <span class="spinner-border spinner-border-sm" *ngIf="isGeneratingSummary()"></span>
            {{ isGeneratingSummary() ? 'Generating...' : 'Generate Summary' }}
          </button>
        </div>
        <div class="summary-content" *ngIf="chatSummary()">
          <div class="summary-text">{{ chatSummary() }}</div>
          <div class="summary-meta">
            <small class="text-muted">
              <i class="bi bi-clock"></i> Generated {{ getCurrentTimestamp() }}
            </small>
          </div>
        </div>
      </div>

      <!-- Admin Actions -->
      <div class="p-4">
        <h6 class="fw-bold mb-3" style="color: var(--primary-navy);">
          <i class="bi bi-gear me-2"></i>
          Admin Actions
        </h6>

        <!-- Status Update -->
        <div class="mb-3">
          <label class="form-label fw-medium">Update Status</label>
          <div class="d-flex gap-2">
            <button 
              (click)="updateStatus('new')"
              [class]="getStatusButtonClass('new')"
              [disabled]="isUpdating()">
              New
            </button>
            <button 
              (click)="updateStatus('in-progress')"
              [class]="getStatusButtonClass('in-progress')"
              [disabled]="isUpdating()">
              In Progress
            </button>
            <button 
              (click)="updateStatus('resolved')"
              [class]="getStatusButtonClass('resolved')"
              [disabled]="isUpdating()">
              Resolved
            </button>
          </div>
        </div>

        <!-- Admin Notes -->
        <div class="mb-3">
          <label class="form-label fw-medium">Admin Notes</label>
          <textarea 
            [(ngModel)]="adminNotes"
            class="us-input"
            rows="3"
            placeholder="Add notes about this service request...">
          </textarea>
        </div>

        <!-- Save Notes -->
        <button 
          (click)="saveNotes()"
          [disabled]="isUpdating()"
          class="us-btn us-btn-primary w-100">
          <span *ngIf="!isUpdating()">
            <i class="bi bi-save me-2"></i>
            Save Notes
          </span>
          <span *ngIf="isUpdating()">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Saving...
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .request-info {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      background: #f8f9fa;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    
    .info-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .info-sub {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    
    .status-badge, .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .bg-primary .status-dot { background: #0d6efd; }
    .bg-warning .status-dot { background: #ffc107; }
    .bg-success .status-dot { background: #198754; }
    
    .summary-section, .chat-section {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .section-header i {
      color: var(--primary-blue);
      font-size: 1.25rem;
    }
    
    .section-header h6 {
      margin: 0;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .message-count {
      background: var(--text-secondary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      margin-left: auto;
    }
    
    .summary-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .summary-content {
      background: #f8f9fa;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      padding: 1rem;
    }
    
    .summary-text {
      white-space: pre-wrap;
      line-height: 1.6;
      color: var(--text-primary);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .summary-meta {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .action-btn.primary {
      background: var(--primary-blue);
      color: white;
    }
    
    .action-btn.secondary {
      background: #f8f9fa;
      color: var(--text-primary);
      border: 1px solid var(--border-light);
    }
    

    
    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    

    
    .chat-messages {
      max-height: 400px;
      overflow-y: auto;
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
    }
    
    .pdf-section {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      background: rgba(255, 193, 7, 0.05);
    }
    
    .pdf-indicator {
      background: #ffc107;
      color: #000;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      margin-left: auto;
    }
    
    .pdf-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .pdf-content {
      background: white;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 1rem;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .pdf-text {
      white-space: pre-wrap;
      line-height: 1.6;
      color: var(--text-primary);
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }
    
    .pdf-meta {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
  `]
})
export class RequestDetailsComponent {
  @Input() request: ServiceRequest | null = null;
  @Output() close = new EventEmitter<void>();

  adminNotes = '';
  isUpdating = signal(false);
  isGeneratingSummary = signal(false);
  chatSummary = signal<string>('');
  showPdfContent = signal(false);

  constructor(private serviceRequestService: ServiceRequestService) {}

  ngOnInit() {
    if (this.request?.adminNotes) {
      this.adminNotes = this.request.adminNotes;
    }
  }

  onClose() {
    this.close.emit();
  }

  updateStatus(status: 'new' | 'in-progress' | 'resolved') {
    if (!this.request) return;

    this.isUpdating.set(true);
    
    setTimeout(() => {
      if (status === 'resolved') {
        this.serviceRequestService.resolveRequest(this.request!.id, this.adminNotes);
      } else if (status === 'in-progress') {
        this.serviceRequestService.acknowledgeRequest(this.request!.id);
      }
      this.isUpdating.set(false);
    }, 500);
  }

  saveNotes() {
    if (!this.request) return;

    this.isUpdating.set(true);
    
    setTimeout(() => {
      // Update notes only - implement if needed
      console.log('Saving notes:', this.adminNotes);
      this.isUpdating.set(false);
    }, 500);
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'new': return 'bg-primary';
      case 'in-progress': return 'bg-warning';
      case 'resolved': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusButtonClass(status: string): string {
    const baseClass = 'us-btn us-btn-secondary us-btn-sm';
    return this.request?.status === status ? 'us-btn us-btn-primary us-btn-sm' : baseClass;
  }

  getConfidenceClass(level?: string): string {
    switch(level) {
      case 'HIGH': return 'confidence-high';
      case 'MEDIUM': return 'confidence-medium';
      case 'LOW': return 'confidence-low';
      default: return 'confidence-medium';
    }
  }

  getPriorityBadgeClass(priority?: string): string {
    switch(priority) {
      case 'critical': return 'bg-danger text-white';
      case 'high': return 'bg-warning text-dark';
      case 'medium': return 'bg-info text-white';
      case 'low': return 'bg-secondary text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getEscalationSourceLabel(source?: string): string {
    switch(source) {
      case 'rag_system': return 'FAQ System';
      case 'frontend_analysis': return 'Chat Analysis';
      case 'manual': return 'Manual Transfer';
      default: return 'Unknown';
    }
  }

  async generateChatSummary() {
    if (!this.request?.chatHistory.length) {
      this.chatSummary.set('No conversation history available.');
      return;
    }
    
    this.isGeneratingSummary.set(true);
    
    try {
      // Call backend API to generate comprehensive summary
      const response = await fetch('http://localhost:8093/api/v1/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: this.request.id,
          chatHistory: this.request.chatHistory,
          pdfContent: this.request.pdfExtractedText || localStorage.getItem('lastPdfExtraction'),
          pdfFilename: this.request.pdfFilename || localStorage.getItem('lastPdfFilename'),
          customerInfo: {
            name: this.request.customerName,
            email: this.request.customerEmail,
            id: this.request.customerId
          },
          escalationReason: this.request.escalationReason,
          priority: this.request.priority
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        this.chatSummary.set(result.summary);
      } else {
        // Fallback to local analysis if API fails
        const meaningfulMessages = this.request.chatHistory.filter(msg => 
          !msg.content.includes('Hello! How may I assist') && 
          !msg.content.includes('Hello! I\'m your SecureBank Assistant') &&
          msg.content.trim().length > 10
        );
        
        const summary = this.analyzeConversationLocally(meaningfulMessages);
        this.chatSummary.set(summary);
      }
      
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to local analysis
      const meaningfulMessages = this.request.chatHistory.filter(msg => 
        !msg.content.includes('Hello! How may I assist') && 
        !msg.content.includes('Hello! I\'m your SecureBank Assistant') &&
        msg.content.trim().length > 10
      );
      
      const summary = this.analyzeConversationLocally(meaningfulMessages);
      this.chatSummary.set(summary);
    } finally {
      this.isGeneratingSummary.set(false);
    }
  }
  
  getCurrentTimestamp(): string {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  getISTTimestamp(timestamp: any): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getISTDate(timestamp: any): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getISTTime(timestamp: any): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  private analyzeConversationLocally(messages: any[]): string {
    const customerMessages = messages.filter(m => m.isUser);
    const assistantMessages = messages.filter(m => !m.isUser);
    
    // Extract key information
    const hasEscalation = assistantMessages.some(m => m.escalated);
    const hasPdfUpload = messages.some(m => m.content.includes('✅') && m.content.includes('.pdf'));
    const hasAccountQuery = customerMessages.some(m => 
      m.content.toLowerCase().includes('account') || 
      m.content.toLowerCase().includes('number')
    );
    
    // Determine main request
    let mainRequest = 'General FAQ inquiry';
    if (hasPdfUpload) mainRequest = 'Document-related question';
    else if (hasAccountQuery) mainRequest = 'Account information question';
    
    // Extract account numbers or names from conversation AND PDF
    const accountNumbers = messages.map(m => m.content.match(/\b\d{10}\b/g)).filter(Boolean).flat();
    const names = messages.map(m => m.content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g)).filter(Boolean).flat();
    
    // Include PDF extracted information if available
    const pdfContent = this.request?.pdfExtractedText;
    if (pdfContent) {
      const pdfAccountNumbers = pdfContent.match(/\b\d{10}\b/g) || [];
      const pdfNames = pdfContent.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
      accountNumbers.push(...pdfAccountNumbers);
      names.push(...pdfNames);
    }
    
    let keyInfo = 'Standard FAQ inquiry';
    if (accountNumbers.length > 0) keyInfo = `Reference #: ${accountNumbers[0]}`;
    if (names.length > 0) keyInfo += names.length > 0 ? `, User: ${names[0]}` : `User: ${names[0]}`;
    
    // Add PDF document info if present
    if (pdfContent && this.request?.pdfFilename) {
      keyInfo += `, Document: ${this.request.pdfFilename}`;
    }
    
    // Determine resolution
    const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
    let resolution = 'In progress';
    if (lastAssistantMsg?.escalated) resolution = 'Escalated to human agent';
    else if (hasPdfUpload && accountNumbers.length > 0) resolution = 'Information successfully extracted from uploaded document';
    
    // Escalation reason
    let escalationReason = 'No escalation';
    if (hasEscalation) {
      if (hasPdfUpload) escalationReason = 'PDF document processing and customer data analysis';
      else escalationReason = 'System confidence below threshold or high-risk query detected';
    }
    
    // Add PDF summary if available
    let pdfSummary = '';
    if (pdfContent) {
      const contentPreview = pdfContent.length > 100 ? pdfContent.substring(0, 100) + '...' : pdfContent;
      pdfSummary = `\n• Document Content: ${contentPreview}`;
    }
    
    return `• Customer Request: ${mainRequest}
• Key Information: ${keyInfo}
• Resolution: ${resolution}
• Escalation: ${escalationReason}${pdfSummary}`;
  }

  hasPdfContent(): boolean {
    return this.request?.chatHistory.some(msg => 
      msg.content.includes('.pdf') && msg.content.includes('✅')
    ) || false;
  }

  getPdfFilename(): string {
    const pdfMessage = this.request?.chatHistory.find(msg => 
      msg.content.includes('.pdf') && msg.content.includes('✅')
    );
    if (pdfMessage) {
      const match = pdfMessage.content.match(/([\w\-_\.]+\.pdf)/i);
      return match ? match[1] : 'document.pdf';
    }
    return 'document.pdf';
  }

  getPdfContent(): string {
    console.log('🔍 ADMIN PDF CONTENT CHECK:', {
      requestId: this.request?.id,
      hasPdfExtractedText: !!this.request?.pdfExtractedText,
      pdfExtractedTextLength: this.request?.pdfExtractedText?.length || 0,
      pdfFilename: this.request?.pdfFilename,
      localStorageContent: localStorage.getItem('lastPdfExtraction')?.length || 0
    });
    
    // Fallback to localStorage if not in request
    const content = this.request?.pdfExtractedText || localStorage.getItem('lastPdfExtraction');
    return content || 'No PDF content available';
  }

  togglePdfContent(): void {
    this.showPdfContent.set(!this.showPdfContent());
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