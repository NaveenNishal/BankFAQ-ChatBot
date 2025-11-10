import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  timestamp: Date;
  status: 'new' | 'in-progress' | 'resolved';
  chatHistory: any[];
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
  createdAt?: number;
}

export interface CreateServiceRequestRequest {
  customerId: string;
  customerName: string;
  customerEmail: string;
  chatHistory: any[];
  escalationReason?: string;
  priority?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  private serviceRequests = new BehaviorSubject<ServiceRequest[]>([]);
  public serviceRequests$ = this.serviceRequests.asObservable();
  private selectedRequestSubject = new BehaviorSubject<ServiceRequest | null>(null);
  public selectedRequest = this.selectedRequestSubject.asObservable();

  constructor(private http: HttpClient) {}

  createServiceRequest(request: CreateServiceRequestRequest): Observable<{success: boolean, serviceRequestId: string}> {
    return this.http.post<{success: boolean, serviceRequestId: string}>(`${environment.apiUrl}/api/service-requests`, request);
  }

  loadServiceRequests(): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(`${environment.apiUrl}/api/service-requests`);
  }

  refreshServiceRequests() {
    this.loadServiceRequests().subscribe({
      next: (requests) => {
        this.serviceRequests.next(requests);
      },
      error: (err) => {
        console.error('Failed to load service requests:', err);
      }
    });
  }

  addServiceRequest(request: ServiceRequest) {
    const current = this.serviceRequests.getValue();
    this.serviceRequests.next([request, ...current]);
  }

  getServiceRequests(): ServiceRequest[] {
    return this.serviceRequests.getValue();
  }

  selectRequest(request: ServiceRequest) {
    this.selectedRequestSubject.next(request);
  }

  clearSelection() {
    this.selectedRequestSubject.next(null);
  }

  acknowledgeRequest(requestId: string) {
    this.updateRequestStatus(requestId, 'in-progress');
  }

  resolveRequest(requestId: string) {
    this.updateRequestStatus(requestId, 'resolved');
  }

  private updateRequestStatus(requestId: string, status: 'new' | 'in-progress' | 'resolved') {
    const current = this.serviceRequests.getValue();
    const updated = current.map(req => 
      req.id === requestId ? { ...req, status, lastUpdated: new Date() } : req
    );
    this.serviceRequests.next(updated);
    
    if (this.selectedRequestSubject.getValue()?.id === requestId) {
      const updatedRequest = updated.find(req => req.id === requestId);
      if (updatedRequest) {
        this.selectedRequestSubject.next(updatedRequest);
      }
    }
    
    this.http.patch(`${environment.apiUrl}/api/service-requests/${requestId}`, { status }).subscribe({
      error: (err) => console.error('Failed to update status on backend:', err)
    });
  }

  deleteArchivedRequest(requestId: string) {
    const current = this.serviceRequests.getValue();
    const filtered = current.filter(req => req.id !== requestId);
    this.serviceRequests.next(filtered);
  }

  reloadEscalations() {
    this.refreshServiceRequests();
  }
}