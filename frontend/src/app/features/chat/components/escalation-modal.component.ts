import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" *ngIf="isVisible">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modern-card border-0">
          
          <!-- Success State -->
          <div *ngIf="!isProcessing() && serviceRequestId()" class="modal-body text-center p-5">
            <div class="mb-4">
              <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
            </div>
            <h4 class="fw-bold mb-3" style="color: var(--primary-navy);">Request Escalated Successfully</h4>
            <p class="text-muted mb-4">{{ successMessage() }}</p>
            
            <div class="bg-light rounded-3 p-3 mb-4">
              <small class="text-muted fw-medium">Service Request ID</small>
              <div class="fw-bold" style="color: var(--accent-blue); font-size: 1.1rem;">
                {{ serviceRequestId() }}
              </div>
            </div>
            
            <button 
              (click)="onClose()"
              class="btn btn-modern-primary px-4">
              Continue Chatting
            </button>
          </div>

          <!-- Processing State -->
          <div *ngIf="isProcessing()" class="modal-body text-center p-5">
            <div class="mb-4">
              <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
                <span class="visually-hidden">Processing...</span>
              </div>
            </div>
            <h4 class="fw-bold mb-3" style="color: var(--primary-navy);">Escalating Your Request</h4>
            <p class="text-muted mb-0">Please wait while we create your service request...</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EscalationModalComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();

  isProcessing = signal(false);
  serviceRequestId = signal('');
  successMessage = signal('');

  showProcessing() {
    this.isProcessing.set(true);
    this.serviceRequestId.set('');
    this.successMessage.set('');
  }

  showSuccess(requestId: string, message: string) {
    this.isProcessing.set(false);
    this.serviceRequestId.set(requestId);
    this.successMessage.set(message);
  }

  onClose() {
    this.close.emit();
  }
}