import { Injectable } from '@angular/core';
import { ServiceRequest } from '../models/service-request.models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly SERVICE_REQUESTS_KEY = 'serviceRequests';

  saveServiceRequest(serviceRequest: ServiceRequest): void {
    const existing = this.getAllServiceRequests();
    existing.push(serviceRequest);
    localStorage.setItem(this.SERVICE_REQUESTS_KEY, JSON.stringify(existing));
  }

  getAllServiceRequests(): ServiceRequest[] {
    const stored = localStorage.getItem(this.SERVICE_REQUESTS_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((sr: any) => ({
        ...sr,
        timestamp: new Date(sr.timestamp),
        resolvedAt: sr.resolvedAt ? new Date(sr.resolvedAt) : undefined,
        chatHistory: sr.chatHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch {
      return [];
    }
  }

  getServiceRequestById(id: string): ServiceRequest | null {
    const all = this.getAllServiceRequests();
    return all.find(sr => sr.id === id) || null;
  }

  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): boolean {
    const all = this.getAllServiceRequests();
    const index = all.findIndex(sr => sr.id === id);
    
    if (index === -1) return false;
    
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(this.SERVICE_REQUESTS_KEY, JSON.stringify(all));
    return true;
  }

  generateServiceRequestId(): string {
    return 'SR_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}