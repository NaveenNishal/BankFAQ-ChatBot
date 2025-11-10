import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h4 class="modal-title">{{ title }}</h4>
          <button class="close-btn" (click)="onCancel()">×</button>
        </div>
        
        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p class="warning-message">{{ message }}</p>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button class="btn btn-danger" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
    }
    
    .modal-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: between;
      align-items: center;
    }
    
    .modal-title {
      margin: 0;
      color: var(--text-primary, #212529);
      font-weight: 600;
      flex: 1;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-body {
      padding: 24px;
      text-align: center;
    }
    
    .warning-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .warning-message {
      color: #495057;
      font-size: 16px;
      line-height: 1.5;
      margin: 0;
    }
    
    .modal-footer {
      padding: 16px 24px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary {
      background: var(--text-secondary, #6c757d);
      color: white;
    }
    
    .btn-secondary:hover {
      background: #5a6268;
    }
    
    .btn-danger {
      background: var(--action-red, #de162b);
      color: white;
    }
    
    .btn-danger:hover {
      filter: brightness(0.9);
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}