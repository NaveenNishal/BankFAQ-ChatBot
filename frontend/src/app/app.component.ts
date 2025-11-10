import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header.component';
import { FooterComponent } from './core/layout/footer.component';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-header />
      <main class="main-content">
        <router-outlet />
      </main>
      <app-footer />
      
      <!-- Escalation Modal -->
      <div *ngIf="showEscalationModal" class="escalation-modal">
        <div class="modal-content">
          <h3>{{ getTranslation('escalation.title') }}</h3>
          <p>{{ getTranslation('escalation.message') }}</p>
          <div class="modal-actions">
            <button (click)="connectToAgent()" class="btn-primary">
              {{ getTranslation('escalation.connect') }}
            </button>
            <button (click)="closeEscalationModal()" class="btn-secondary">
              {{ getTranslation('escalation.continue') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    .escalation-modal {
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
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
    }
    
    .modal-actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .btn-primary, .btn-secondary {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'BankFAQ Assistant';
  showEscalationModal = false;
  
  constructor(private translationService: TranslationService) {}
  
  ngOnInit() {
    // Listen for escalation events
    this.translationService.escalationRequired$.subscribe(() => {
      this.showEscalationModal = true;
    });
  }
  
  getTranslation(key: string): string {
    return this.translationService.getTranslation(key);
  }
  
  connectToAgent() {
    // Implement agent connection logic
    alert('Connecting you to a human representative...');
    this.showEscalationModal = false;
  }
  
  closeEscalationModal() {
    this.showEscalationModal = false;
  }
}