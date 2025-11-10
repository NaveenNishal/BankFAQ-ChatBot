import { Injectable, signal } from '@angular/core';
import { StorageService } from '../../../shared/services/storage.service';
import { AuthService } from '../../auth/services/auth.service';
import { ChatMessage, ServiceRequest, CreateServiceRequestResponse } from '../../../shared/models/service-request.models';

@Injectable({
  providedIn: 'root'
})
export class EscalationService {
  private isEscalating = signal(false);

  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  get escalating() {
    return this.isEscalating.asReadonly();
  }

  escalateChat(chatHistory: ChatMessage[]): Promise<CreateServiceRequestResponse> {
    return new Promise((resolve) => {
      this.isEscalating.set(true);

      setTimeout(() => {
        const currentUser = this.authService.currentAuth();
        const serviceRequestId = this.storageService.generateServiceRequestId();

        const serviceRequest: ServiceRequest = {
          id: serviceRequestId,
          customerId: currentUser.userId,
          customerName: currentUser.userName,
          timestamp: new Date(),
          status: 'new',
          chatHistory: [...chatHistory]
        };

        this.storageService.saveServiceRequest(serviceRequest);

        const response: CreateServiceRequestResponse = {
          serviceRequestId,
          status: 'created',
          message: `Your request has been sent to an agent. Service Request ID: ${serviceRequestId}. We will contact you shortly.`
        };

        this.isEscalating.set(false);
        resolve(response);
      }, 1500);
    });
  }
}