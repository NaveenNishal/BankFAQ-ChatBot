import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <!-- U.S. Bank Footer -->
    <footer class="us-bank-footer">
      <div class="us-container">
        <div class="us-footer-content">
          <!-- Footer Links -->
          <div class="us-footer-sections us-text-center">
            <div class="us-footer-info">
              <h4>BankFAQ Assistant</h4>
              <p class="us-text-secondary">Get instant answers to your banking questions 24/7</p>
              <p class="us-text-secondary">Secure • Reliable • Always Available</p>
            </div>
          </div>
          
          <!-- Footer Bottom -->
          <div class="us-footer-bottom">
            <div class="us-security-badges us-flex us-items-center us-gap-4">
              <div class="us-security-item us-flex us-items-center us-gap-2">
                <i class="bi bi-shield-check" style="color: var(--success-green);"></i>
                <span>FDIC Insured</span>
              </div>
              <div class="us-security-item us-flex us-items-center us-gap-2">
                <i class="bi bi-lock" style="color: var(--success-green);"></i>
                <span>256-bit SSL</span>
              </div>
              <div class="us-security-item us-flex us-items-center us-gap-2">
                <i class="bi bi-award" style="color: var(--success-green);"></i>
                <span>SOC 2 Compliant</span>
              </div>
            </div>
            
            <div class="us-copyright">
              <p>&copy; 2025 BankFAQ. All rights reserved. Banking information service.</p>
              <p style="font-size: 0.75rem; margin-top: 8px;">Member FDIC. Equal Housing Lender. Banking products and services provided by BankFAQ.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* U.S. Bank Footer Styles */
    .us-bank-footer {
      background: var(--card-white, #ffffff);
      border-top: 1px solid var(--border-light, #dee2e6);
      padding: var(--space-6, 48px) 0 var(--space-4, 32px);
      margin-top: auto;
    }
    
    .us-footer-sections {
      margin-bottom: var(--space-5, 40px);
    }
    
    .us-footer-info h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary, #212529);
      margin-bottom: var(--space-2, 16px);
    }
    
    .us-footer-column h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #212529);
      margin-bottom: var(--space-2, 16px);
    }
    
    .us-footer-column ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .us-footer-column li {
      margin-bottom: var(--space-1, 8px);
    }
    
    .us-footer-column a {
      color: var(--text-secondary, #6c757d);
      text-decoration: none;
      font-size: 0.875rem;
    }
    
    .us-footer-column a:hover {
      color: var(--primary-blue, #0a41c5);
    }
    
    .us-social-links a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--background-grey, #f8f9fa);
      border-radius: 50%;
      color: var(--text-secondary, #6c757d);
      font-size: 1.25rem;
      transition: all 0.2s ease;
    }
    
    .us-social-links a:hover {
      background: var(--primary-blue, #0a41c5);
      color: white;
    }
    
    .us-footer-bottom {
      border-top: 1px solid var(--border-light, #dee2e6);
      padding-top: var(--space-4, 32px);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .us-security-item {
      font-size: 0.875rem;
      color: var(--text-secondary, #6c757d);
    }
    
    .us-copyright p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #6c757d);
    }
    
    @media (max-width: 768px) {
      .us-footer-sections {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .us-footer-bottom {
        flex-direction: column;
        gap: var(--space-3, 24px);
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {}