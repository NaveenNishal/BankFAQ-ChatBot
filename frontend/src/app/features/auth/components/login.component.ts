import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- U.S. Bank Style Login Page -->
    
    <div class="us-login-page">
      <div class="us-container">
        <div class="us-grid-2">
          
          <!-- Left Column: Marketing Content -->
          <div class="us-marketing-section">
            <h1 class="us-hero-title">Get instant answers to your banking questions.</h1>
            <p class="us-hero-description">
              Our FAQ bot provides quick answers about account types, fees, services, 
              branch locations, and banking policies - available 24/7.
            </p>
            
            <div class="us-action-buttons us-flex us-gap-3 us-mb-4">
              <button 
                (click)="goToRegister()"
                class="us-btn us-btn-primary us-btn-lg">
                <i class="bi bi-person-plus me-2"></i>
                Enroll Now
              </button>
              <button class="us-btn us-btn-secondary us-btn-lg">
                <i class="bi bi-phone me-2"></i>
                Get Mobile App
              </button>
            </div>
            
            <div class="us-features">
              <div class="us-feature-item us-flex us-items-center us-gap-2 us-mb-2">
                <i class="bi bi-shield-check" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>Bank-grade security & encryption</span>
              </div>
              <div class="us-feature-item us-flex us-items-center us-gap-2 us-mb-2">
                <i class="bi bi-robot" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>24/7 FAQ assistance</span>
              </div>
              <div class="us-feature-item us-flex us-items-center us-gap-2">
                <i class="bi bi-graph-up" style="color: var(--primary-blue); font-size: 1.25rem;"></i>
                <span>Instant banking information</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Login Form -->
          <div class="us-login-section">
            <div class="us-card us-card-lg">
              <div class="us-login-header us-mb-4">
                <h3>Access BankFAQ</h3>
                <p>Get answers to banking questions</p>
              </div>

              <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
                <div class="us-form-group">
                  <label class="us-label">Email Address</label>
                  <input 
                    type="email" 
                    [(ngModel)]="email" 
                    name="email"
                    class="us-input"
                    placeholder="Enter your email"
                    required>
                </div>

                <div class="us-form-group">
                  <label class="us-label">Password</label>
                  <input 
                    type="password" 
                    [(ngModel)]="password" 
                    name="password"
                    class="us-input"
                    placeholder="Enter your password"
                    required>
                </div>

                <div class="us-form-group">
                  <label class="us-label">Account Type</label>
                  <div class="us-role-selection us-flex us-gap-2">
                    <div 
                      class="us-role-card" 
                      [class.selected]="selectedRole() === 'customer'"
                      (click)="selectRole('customer')">
                      <i class="bi bi-person-circle"></i>
                      <span>Customer</span>
                    </div>
                    <div 
                      class="us-role-card" 
                      [class.selected]="selectedRole() === 'admin'"
                      (click)="selectRole('admin')">
                      <i class="bi bi-shield-lock"></i>
                      <span>Admin</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  [disabled]="!loginForm.valid || isLoading()"
                  class="us-btn us-btn-action us-btn-lg" 
                  style="width: 100%;">
                  <span *ngIf="!isLoading()">
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </span>
                  <span *ngIf="isLoading()">
                    <span class="us-spinner"></span>
                    Signing in...
                  </span>
                </button>

                <div *ngIf="errorMessage()" class="us-error-message us-mt-3">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <strong>Authentication Failed</strong><br>
                    {{ errorMessage() }}
                  </div>
                </div>
              </form>

              <div class="us-form-footer us-mt-4">
                <p style="text-align: center; color: var(--text-secondary);">
                  New to BankFAQ? 
                  <a (click)="goToRegister()" style="cursor: pointer;">Sign up</a>
                </p>
                
                <div class="us-admin-info us-card us-mt-3" style="background: #f8f9fa; padding: 12px;">
                  <div style="font-size: 0.875rem; color: var(--text-secondary); text-align: center;">
                    <strong>Admin Access:</strong><br>
                    Email: admin&#64;gmail.com<br>
                    Password: SecureBank2024!
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* U.S. Bank Login Page Styles - Enhanced */
    .us-login-page {
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
    
    .us-login-section .us-card {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .us-login-header {
      text-align: center;
    }
    
    .us-login-header h3 {
      margin-bottom: var(--space-1);
    }
    
    .us-login-header p {
      margin-bottom: 0;
    }
    
    .us-role-selection {
      display: flex;
      gap: var(--space-2);
    }
    
    .us-role-card {
      flex: 1;
      padding: var(--space-2);
      border: 2px solid var(--border-light);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      background: var(--card-white);
    }
    
    .us-role-card:hover {
      border-color: var(--primary-blue);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .us-role-card.selected {
      border-color: var(--primary-blue);
      background: rgba(10, 65, 197, 0.05);
    }
    
    .us-role-card i {
      font-size: 1.5rem;
      color: var(--primary-blue);
      margin-bottom: var(--space-1);
      display: block;
    }
    
    .us-role-card span {
      font-weight: 500;
      color: var(--text-primary);
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
    
    @media (max-width: 768px) {
      .us-login-page {
        padding: var(--space-4) 0;
      }
      
      .us-hero-title {
        font-size: 2.25rem;
      }
      
      .us-hero-description {
        font-size: 1.125rem;
      }
      
      .us-action-buttons {
        flex-direction: column;
      }
      

    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  selectedRole = signal<'customer' | 'admin'>('customer');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  selectRole(role: 'customer' | 'admin') {
    this.selectedRole.set(role);
    this.errorMessage.set('');
    
    if (this.email && this.password) {
      this.onSubmit();
    }
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials: LoginRequest = {
      email: this.email,
      password: this.password,
      role: this.selectedRole()
    };

    setTimeout(() => {
      try {
        const success = this.authService.login(credentials);
        if (!success) {
          if (this.selectedRole() === 'admin') {
            this.errorMessage.set('Invalid admin credentials. Only admin@gmail.com is authorized.');
          } else {
            this.errorMessage.set('Invalid credentials. Please check your email and password or sign up for a new account.');
          }
        }
      } catch (error) {
        this.errorMessage.set('Login failed. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    }, 1000);
  }

  getRoleCardClass(role: 'customer' | 'admin'): string {
    const baseClass = 'role-card';
    return this.selectedRole() === role ? `${baseClass} selected` : baseClass;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}