import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- U.S. Bank Header -->
    <header class="us-bankchat-header">
      <!-- Top Utility Bar -->
      <div class="us-utility-bar">
        <div class="us-container">
          <div class="us-flex us-justify-between us-items-center">
            <div class="us-utility-links us-flex us-gap-4">
              <span>Banking FAQ Assistant</span>
              <span>24/7 Support Available</span>
              <a href="tel:1-800-324-4357">1-800-FAQ-HELP</a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main Navigation Bar -->
      <div class="us-main-nav">
        <div class="us-container">
          <div class="us-flex us-justify-between us-items-center">
            <div class="us-logo-section us-flex us-items-center us-gap-2">
              <i class="bi bi-shield-check" style="font-size: 2rem; color: var(--primary-blue);"></i>
              <div>
                <div style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); line-height: 1;">BankFAQ</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1;">Banking Questions Answered</div>
              </div>
            </div>
            
            <div class="us-nav-actions us-flex us-items-center us-gap-3">
              <span class="us-nav-text">Instant Banking Answers</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    /* U.S. Bank Header Styles */
    .us-bank-header {
      background: var(--card-white, #ffffff);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .us-utility-bar {
      background: var(--background-grey, #f8f9fa);
      padding: 8px 0;
      font-size: 0.875rem;
    }
    
    .us-utility-links a {
      color: var(--text-secondary, #6c757d);
      text-decoration: none;
      font-weight: 500;
    }
    
    .us-utility-links a:hover {
      color: var(--primary-blue, #0a41c5);
    }
    
    .us-main-nav {
      padding: 16px 0;
    }
    
    .us-nav-link {
      color: var(--text-primary, #212529);
      text-decoration: none;
      font-weight: 500;
      padding: 8px 0;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }
    
    .us-nav-text {
      color: var(--text-secondary, #6c757d);
      font-weight: 500;
      font-style: italic;
    }
  `]
})
export class HeaderComponent {}