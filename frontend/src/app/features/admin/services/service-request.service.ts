import { Injectable, signal } from '@angular/core';
import { ServiceRequest } from '../../../shared/models/service-request.models';

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  private activeRequests = signal<ServiceRequest[]>([]);
  private archivedRequests = signal<ServiceRequest[]>([]);

  constructor() {
    this.loadMockData();
  }

  getActiveRequests() {
    return this.activeRequests.asReadonly();
  }

  getArchivedRequests() {
    return this.archivedRequests.asReadonly();
  }

  getRequestStats() {
    const active = this.activeRequests();
    return {
      total: active.length,
      new: active.filter(r => r.status === 'new').length,
      inProgress: active.filter(r => r.status === 'in-progress').length,
      resolved: this.archivedRequests().length
    };
  }

  selectedRequest = signal<ServiceRequest | null>(null);

  selectRequest(request: ServiceRequest) {
    this.selectedRequest.set(request);
  }

  clearSelection() {
    this.selectedRequest.set(null);
  }

  acknowledgeRequest(requestId: string) {
    this.activeRequests.update(requests => 
      requests.map(req => {
        if (req.id === requestId) {
          const updated = { ...req, status: 'in-progress' as const, acknowledgedAt: new Date(), lastUpdated: new Date() };
          if (this.selectedRequest()?.id === requestId) {
            this.selectedRequest.set(updated);
          }
          return updated;
        }
        return req;
      })
    );
    this.persistToLocalStorage();
  }

  resolveRequest(requestId: string, adminNotes?: string) {
    const request = this.activeRequests().find(req => req.id === requestId);
    if (request) {
      const resolvedRequest = {
        ...request,
        status: 'resolved' as const,
        resolvedAt: new Date(),
        lastUpdated: new Date(),
        adminNotes: adminNotes || request.adminNotes
      };

      if (this.selectedRequest()?.id === requestId) {
        this.selectedRequest.set(resolvedRequest);
      }

      this.archivedRequests.update(archived => [...archived, resolvedRequest]);
      this.activeRequests.update(requests => 
        requests.filter(req => req.id !== requestId)
      );
      this.persistToLocalStorage();
    }
  }

  deleteArchivedRequest(requestId: string) {
    this.archivedRequests.update(archived => 
      archived.filter(req => req.id !== requestId)
    );
  }

  addServiceRequest(request: Omit<ServiceRequest, 'id' | 'timestamp' | 'lastUpdated'>) {
    const newRequest: ServiceRequest = {
      ...request,
      id: 'SR-' + Date.now(),
      timestamp: new Date(),
      lastUpdated: new Date()
    };
    
    this.activeRequests.update(requests => [newRequest, ...requests]);
    return newRequest.id;
  }

  private loadMockData() {
    // Load real escalations from localStorage first
    this.loadRealEscalations();
    
    // Check if we have real data
    const existingRequests = this.activeRequests();
    if (existingRequests.length > 0) {
      return; // Don't add mock data if we have real escalations
    }

    const mockRequests: ServiceRequest[] = [
      {
        id: 'SR-2024-001',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        status: 'new',
        priority: 'high',
        escalationReason: 'Fraud Detection - Suspicious Transaction',
        escalationSource: 'rag_system',
        chatHistory: [
          {
            id: 'msg1',
            content: 'Someone used my card without permission!',
            isUser: true,
            timestamp: new Date(Date.now() - 3 * 60 * 1000)
          },
          {
            id: 'msg2',
            content: 'I understand this is about fraud. For your security, I\'m connecting you with our specialized team immediately.',
            isUser: false,
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            escalated: true
          }
        ],
        lastUpdated: new Date(Date.now() - 2 * 60 * 1000)
      }
    ];

    this.activeRequests.set(mockRequests);
  }

  private loadRealEscalations() {
    try {
      const escalations = JSON.parse(localStorage.getItem('escalations') || '[]');
      const activeEscalations = escalations.filter((req: ServiceRequest) => req.status !== 'resolved').map(this.deserializeDates);
      const archivedEscalations = escalations.filter((req: ServiceRequest) => req.status === 'resolved').map(this.deserializeDates);
      
      if (activeEscalations.length > 0) {
        this.activeRequests.set(activeEscalations);
      }
      if (archivedEscalations.length > 0) {
        this.archivedRequests.set(archivedEscalations);
      }
    } catch (error) {
      console.error('Error loading escalations:', error);
    }
  }

  addRealEscalation(serviceRequest: ServiceRequest) {
    console.log('ADMIN: New escalation received:', serviceRequest);
    this.activeRequests.update(requests => [serviceRequest, ...requests]);
    this.persistToLocalStorage();
  }

  // Public method to reload data
  reloadEscalations() {
    this.loadRealEscalations();
  }

  private persistToLocalStorage() {
    const allRequests = [...this.activeRequests(), ...this.archivedRequests()];
    localStorage.setItem('escalations', JSON.stringify(allRequests));
  }

  private deserializeDates(req: any): ServiceRequest {
    return {
      ...req,
      timestamp: new Date(req.timestamp),
      lastUpdated: new Date(req.lastUpdated),
      acknowledgedAt: req.acknowledgedAt ? new Date(req.acknowledgedAt) : undefined,
      resolvedAt: req.resolvedAt ? new Date(req.resolvedAt) : undefined,
      chatHistory: req.chatHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };
  }
}