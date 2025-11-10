import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalation-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="escalation-buttons" *ngIf="!isHidden()">
      <button 
        (click)="onSatisfied()"
        class="us-btn us-btn-secondary us-btn-sm">
        <i class="bi bi-check-circle"></i>
        I'm Satisfied
      </button>
      <button 
        (click)="onEscalate()"
        class="us-btn us-btn-primary us-btn-sm">
        <i class="bi bi-chat-dots"></i>
        Talk to a Live Agent
      </button>
    </div>
  `,
  styles: [`
    .escalation-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: rgba(248, 249, 250, 0.8);
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }
  `]
})
export class EscalationButtonsComponent {
  @Output() satisfied = new EventEmitter<void>();
  @Output() escalate = new EventEmitter<void>();
  
  isHidden = signal(false);

  onSatisfied() {
    this.isHidden.set(true);
    this.satisfied.emit();
  }

  onEscalate() {
    this.isHidden.set(true);
    this.escalate.emit();
  }
}