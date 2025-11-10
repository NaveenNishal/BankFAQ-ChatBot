import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService } from '../services/registration.service';
import { UserRegistration } from '../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="us-register-page">
      <div class="us-container">
        <div class="us-grid-2">
          
          <!-- Left Column: Marketing Content -->
          <div class="us-marketing-section">
            <h1 class="us-hero-title">Sign up for FAQ access.</h1>
            <p class="us-hero-description">
              Create your account to access our comprehensive FAQ system and get 
              instant answers to all your banking questions.
            </p>
            
            <div class="us-features">
              <div class="us-feature-item us-flex us-items-center us-gap-2 us-mb-3">
                <i class="bi bi-shield-check" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>FDIC insured up to $250,000</span>
              </div>
              <div class="us-feature-item us-flex us-items-center us-gap-2 us-mb-3">
                <i class="bi bi-clock" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>Instant FAQ access</span>
              </div>
              <div class="us-feature-item us-flex us-items-center us-gap-2 us-mb-3">
                <i class="bi bi-credit-card" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>Free FAQ service</span>
              </div>
              <div class="us-feature-item us-flex us-items-center us-gap-2">
                <i class="bi bi-phone" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>24/7 FAQ availability</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Registration Form -->
          <div class="us-register-section">
            <div class="us-card us-card-lg">
              <div class="us-register-header us-mb-4">
                <h3>Create Your FAQ Account</h3>
                <p>Get instant access to banking information</p>
              </div>

              <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
                <!-- Name Field -->
                <div class="us-form-group-spaced">
                  <label class="us-label">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    [(ngModel)]="registration.name"
                    name="name"
                    class="us-input"
                    placeholder="Enter your full name"
                    required>
                </div>

                <!-- Email Field -->
                <div class="us-form-group-spaced">
                  <label class="us-label">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    [(ngModel)]="registration.email"
                    name="email"
                    class="us-input"
                    placeholder="Enter your email address"
                    required>
                </div>

                <!-- Password Field -->
                <div class="us-form-group-spaced">
                  <label class="us-label">Password</label>
                  <input 
                    type="password" 
                    id="password"
                    [(ngModel)]="registration.password"
                    name="password"
                    class="us-input"
                    placeholder="Create a secure password"
                    required>
                </div>

                <!-- Confirm Password Field -->
                <div class="us-form-group-spaced">
                  <label class="us-label">Confirm Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword"
                    [(ngModel)]="registration.confirmPassword"
                    name="confirmPassword"
                    class="us-input"
                    placeholder="Confirm your password"
                    required>
                </div>

                <!-- Terms Acceptance -->
                <div class="us-form-group-spaced">
                  <div class="us-checkbox-container">
                    <input 
                      type="checkbox" 
                      id="acceptTerms"
                      [(ngModel)]="registration.acceptTerms"
                      name="acceptTerms"
                      class="us-checkbox"
                      required>
                    <label for="acceptTerms" class="us-checkbox-label">
                      I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>
                    </label>
                  </div>
                </div>

                <!-- Register Button -->
                <button 
                  type="submit"
                  [disabled]="isLoading() || !isFormValid()"
                  class="us-btn us-btn-action us-btn-lg"
                  style="width: 100%;">
                  <span *ngIf="!isLoading()">
                    <i class="bi bi-person-check me-2"></i>
                    Create Account
                  </span>
                  <span *ngIf="isLoading()">
                    <span class="us-spinner"></span>
                    Creating Account...
                  </span>
                </button>

                <!-- Error Message -->
                <div *ngIf="errorMessage()" class="us-error-message us-mt-3">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <strong>Registration Failed</strong><br>
                    {{ errorMessage() }}
                  </div>
                </div>

                <!-- Success Message -->
                <div *ngIf="successMessage()" class="us-success-message us-mt-3">
                  <i class="bi bi-check-circle-fill"></i>
                  <div>
                    <strong>Account Created</strong><br>
                    {{ successMessage() }}
                  </div>
                </div>
              </form>

              <!-- Login Link -->
              <div class="us-form-footer us-mt-4">
                <p style="text-align: center; color: var(--text-secondary);">
                  Already have an account? 
                  <a (click)="goToLogin()" style="cursor: pointer;">Sign In</a>
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* U.S. Bank Register Page Styles - Matching Login */
    .us-register-page {
      min-height: 60vh;
      padding: var(--space-6) 0;
      display: flex;
      align-items: center;
      background: var(--background-grey);
    }
    
    .us-hero-title {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: var(--space-4);
      color: var(--text-primary);
    }
    
    .us-hero-description {
      font-size: 1.25rem;
      line-height: 1.6;
      margin-bottom: var(--space-6);
      color: var(--text-secondary);
    }
    
    .us-register-section .us-card {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .us-register-header {
      text-align: center;
    }
    
    .us-register-header h3 {
      margin-bottom: var(--space-1);
    }
    
    .us-register-header p {
      margin-bottom: 0;
    }
    
    /* Enhanced Form Spacing */
    .us-form-group-spaced {
      margin-bottom: var(--space-5);
    }
    
    /* Modern Checkbox Styling */
    .us-checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }
    
    .us-checkbox {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: var(--primary-blue);
    }
    
    .us-checkbox-label {
      font-size: 0.875rem;
      color: var(--text-primary);
      line-height: 1.5;
    }
    
    .terms-link {
      color: var(--primary-blue);
      text-decoration: none;
    }
    
    .terms-link:hover {
      text-decoration: underline;
    }
    
    .us-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: var(--space-1);
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .us-error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: var(--space-2);
      display: flex;
      align-items: flex-start;
      gap: var(--space-1);
    }
    
    .us-error-message i {
      color: var(--action-red);
      font-size: 1.125rem;
      margin-top: 2px;
    }
    
    .us-success-message {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-sm);
      padding: var(--space-2);
      display: flex;
      align-items: flex-start;
      gap: var(--space-1);
    }
    
    .us-success-message i {
      color: var(--success-green);
      font-size: 1.125rem;
      margin-top: 2px;
    }
    
    @media (max-width: 768px) {
      .us-register-page {
        padding: var(--space-4) 0;
      }
      
      .us-hero-title {
        font-size: 2.25rem;
      }
      
      .us-hero-description {
        font-size: 1.125rem;
      }
    }
  `]
})
export class RegisterComponent {
  registration: UserRegistration = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    registrationDate: new Date()
  };

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private registrationService: RegistrationService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    setTimeout(() => {
      try {
        const success = this.registrationService.register(this.registration);
        if (success) {
          this.successMessage.set('Banking account opened successfully! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage.set('Account creation failed. Email may already be registered.');
        }
      } catch (error) {
        this.errorMessage.set('Account creation failed. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    }, 1000);
  }

  isFormValid(): boolean {
    return !!(
      this.registration.name.trim() &&
      this.registration.email.trim() &&
      this.registration.password.trim() &&
      this.registration.confirmPassword.trim() &&
      this.registration.password === this.registration.confirmPassword &&
      this.registration.acceptTerms
    );
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}