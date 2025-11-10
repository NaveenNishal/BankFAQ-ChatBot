import { Injectable, signal } from '@angular/core';
import { ChatMessage, ServiceRequest } from '../../../shared/models/service-request.models';
import { StorageService } from '../../../shared/services/storage.service';
import { AuthService } from '../../auth/services/auth.service';

export interface EscalationTrigger {
  type: 'frustration' | 'human_request' | 'repeated_failure' | 'rag_escalation';
  confidence: number;
  triggerText: string;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutoEscalationService {
  private conversationHistory = signal<ChatMessage[]>([]);
  private lowConfidenceCount = signal(0);

  private readonly ESCALATION_PATTERNS = {
    frustration: [
      /this (is not|isn't) working/i,
      /i am (angry|frustrated|upset)/i,
      /this is (ridiculous|stupid|useless)/i,
      /why (can't|won't) (you|this)/i,
      /this doesn't help/i,
      /you're not helping/i
    ],
    human_request: [
      /i (need|want) (to speak to|a) (human|person|agent)/i,
      /connect me to (an agent|someone)/i,
      /transfer me to/i,
      /speak to (your|a) manager/i,
      /get me a human/i,
      /talk to someone/i
    ]
  };

  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  updateConversationHistory(messages: ChatMessage[]) {
    this.conversationHistory.set(messages);
  }

  analyzeMessage(message: string, chatHistory: ChatMessage[]): EscalationTrigger | null {
    // Check for frustration patterns
    for (const pattern of this.ESCALATION_PATTERNS.frustration) {
      if (pattern.test(message)) {
        return {
          type: 'frustration',
          confidence: 0.9,
          triggerText: message,
          reason: 'User frustration detected'
        };
      }
    }

    // Check for human request patterns
    for (const pattern of this.ESCALATION_PATTERNS.human_request) {
      if (pattern.test(message)) {
        return {
          type: 'human_request',
          confidence: 0.95,
          triggerText: message,
          reason: 'Direct human agent request'
        };
      }
    }

    // Check for repeated failures (3+ consecutive low confidence responses)
    const recentBotMessages = chatHistory
      .filter(msg => !msg.isUser)
      .slice(-3);

    const lowConfidenceMessages = recentBotMessages.filter(msg => 
      msg.confidenceLevel === 'LOW' || (msg.confidenceScore && msg.confidenceScore < 0.6)
    );

    if (lowConfidenceMessages.length >= 3) {
      return {
        type: 'repeated_failure',
        confidence: 0.8,
        triggerText: message,
        reason: 'Multiple consecutive low confidence responses'
      };
    }

    return null;
  }

  shouldEscalate(ragResponse: any, userMessage: string, chatHistory: ChatMessage[]): boolean {
    // Don't escalate if no valid RAG response (API failure)
    if (!ragResponse) {
      return false;
    }

    // Check RAG escalation first (highest priority)
    if (ragResponse?.escalated) {
      return true;
    }

    // Check frontend conversation analysis
    const frontendTrigger = this.analyzeMessage(userMessage, chatHistory);
    return frontendTrigger !== null;
  }

  async createSilentServiceRequest(
    chatHistory: ChatMessage[], 
    escalationData: { ragResponse?: any; trigger?: EscalationTrigger }
  ): Promise<string> {
    const currentUser = this.authService.currentAuth();
    const serviceRequestId = this.storageService.generateServiceRequestId();

    // Determine escalation source and priority
    let escalationSource: 'rag_system' | 'frontend_analysis' | 'manual' = 'frontend_analysis';
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let reason = 'General escalation';

    if (escalationData.ragResponse?.escalated) {
      escalationSource = 'rag_system';
      if (escalationData.ragResponse.reason?.includes('high-risk')) {
        priority = 'critical';
      } else if (escalationData.ragResponse.reason?.includes('low confidence')) {
        priority = 'high';
      }
      reason = escalationData.ragResponse.reason || 'RAG system escalation';
    } else if (escalationData.trigger) {
      if (escalationData.trigger.type === 'human_request') {
        priority = 'high';
      } else if (escalationData.trigger.type === 'frustration') {
        priority = 'medium';
      }
      reason = escalationData.trigger.reason;
    }

    // Check for PDF content in localStorage
    const lastPdfExtraction = localStorage.getItem('lastPdfExtraction');
    let pdfFilename = '';
    
    // Find PDF filename from chat history
    const pdfMessage = chatHistory.find(msg => 
      msg.content.includes('.pdf') && msg.content.includes('✅')
    );
    if (pdfMessage) {
      const match = pdfMessage.content.match(/([\w\-_\.]+\.pdf)/i);
      pdfFilename = match ? match[1] : '';
    }
    
    // Debug logging for PDF content
    console.log('📄 PDF CONTENT CHECK:', {
      hasPdfExtraction: !!lastPdfExtraction,
      extractionLength: lastPdfExtraction?.length || 0,
      pdfFilename: pdfFilename,
      hasPdfMessage: !!pdfMessage
    });

    const serviceRequest: ServiceRequest = {
      id: serviceRequestId,
      customerId: currentUser.userId,
      customerName: currentUser.userName,
      customerEmail: currentUser.email || `${currentUser.userName.toLowerCase().replace(' ', '.')}@example.com`,
      timestamp: new Date(),
      status: 'new',
      chatHistory: [...chatHistory],
      escalationSource,
      priority,
      escalationReason: reason,
      ragData: escalationData.ragResponse,
      lastUpdated: new Date(),
      pdfExtractedText: lastPdfExtraction || undefined,
      pdfFilename: pdfFilename || undefined
    };

    // Log escalation for admin visibility
    console.log('🚨 ESCALATION CREATED:', {
      serviceRequestId,
      customer: {
        id: currentUser.userId,
        name: currentUser.userName,
        email: serviceRequest.customerEmail
      },
      priority,
      reason,
      source: escalationSource,
      timestamp: new Date().toISOString(),
      hasPdfContent: !!serviceRequest.pdfExtractedText,
      pdfFilename: serviceRequest.pdfFilename
    });

    // Debug: Log the complete service request
    console.log('💾 SERVICE REQUEST STORAGE:', {
      id: serviceRequest.id,
      pdfExtractedText: serviceRequest.pdfExtractedText ? 'PRESENT' : 'MISSING',
      pdfExtractedTextLength: serviceRequest.pdfExtractedText?.length || 0,
      pdfFilename: serviceRequest.pdfFilename || 'NO_FILENAME'
    });
    
    // Store in localStorage for admin dashboard access
    const existingEscalations = JSON.parse(localStorage.getItem('escalations') || '[]');
    existingEscalations.unshift(serviceRequest);
    localStorage.setItem('escalations', JSON.stringify(existingEscalations));
    
    // Notify admin dashboard of new escalation
    this.notifyAdminDashboard(serviceRequest);
    
    return serviceRequestId;
  }

  private notifyAdminDashboard(serviceRequest: ServiceRequest) {
    // Use localStorage event for cross-tab communication
    localStorage.setItem('newEscalation', JSON.stringify({
      timestamp: Date.now(),
      serviceRequest
    }));
    
    console.log('ADMIN NOTIFICATION: New escalation created', {
      id: serviceRequest.id,
      customer: serviceRequest.customerName,
      email: serviceRequest.customerEmail,
      priority: serviceRequest.priority,
      reason: serviceRequest.escalationReason,
      hasPdfContent: !!serviceRequest.pdfExtractedText
    });
  }

  getEscalationMessage(escalationData: { ragResponse?: any; trigger?: EscalationTrigger }): string {
    if (escalationData.ragResponse?.escalated) {
      // Use RAG system message if available
      return escalationData.ragResponse.response || 
        "I've escalated this to our specialist team for immediate attention. They will contact you shortly.";
    }

    if (escalationData.trigger) {
      switch (escalationData.trigger.type) {
        case 'human_request':
          return "I understand you'd like to speak with a human agent. I've connected you with our support team who will assist you shortly.";
        case 'frustration':
          return "I can see this is frustrating for you. Let me connect you with a specialist who can provide better assistance.";
        case 'repeated_failure':
          return "I'm having difficulty providing the right answers. I've escalated this to our expert team for personalized help.";
        default:
          return "I've escalated your request to our support team for specialized assistance.";
      }
    }

    return "Your request has been escalated to our support team for further assistance.";
  }
}