export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  escalated?: boolean;
  confidenceScore?: number;
  confidenceLevel?: string;
  feedbackGiven?: boolean;
  feedback?: 'like' | 'dislike';
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  timestamp: Date;
  status: 'new' | 'in-progress' | 'resolved';
  chatHistory: ChatMessage[];
  escalationSource?: 'rag_system' | 'frontend_analysis' | 'manual';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  escalationReason?: string;
  ragData?: any;
  adminNotes?: string;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  assignedTo?: string;
  lastUpdated: Date;
  pdfExtractedText?: string;
  pdfFilename?: string;
}

export interface CreateServiceRequestRequest {
  customerId: string;
  customerName: string;
  chatHistory: ChatMessage[];
}

export interface CreateServiceRequestResponse {
  serviceRequestId: string;
  status: string;
  message: string;
}