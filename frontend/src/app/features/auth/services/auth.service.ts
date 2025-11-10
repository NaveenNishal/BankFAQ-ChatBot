import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState, LoginRequest } from '../models/auth.models';
import { RegistrationService } from './registration.service';
import { ChatStateService } from '../../../services/chat-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ADMIN_CREDENTIALS = {
    email: 'admin@gmail.com',
    password: 'SecureBank2024!'
  };

  private authState = signal<AuthState>({
    isAuthenticated: false,
    userRole: null,
    userId: '',
    userName: '',
    email: '',
    loginTimestamp: new Date()
  });

  constructor(
    private router: Router,
    private registrationService: RegistrationService,
    private chatStateService: ChatStateService
  ) {
    this.loadAuthState();
  }

  get currentAuth() {
    return this.authState.asReadonly();
  }

  login(credentials: LoginRequest): boolean {
    // Admin authentication - hardcoded credentials
    if (credentials.role === 'admin') {
      if (credentials.email === this.ADMIN_CREDENTIALS.email && 
          credentials.password === this.ADMIN_CREDENTIALS.password) {
        
        const newAuthState: AuthState = {
          isAuthenticated: true,
          userRole: 'admin',
          userId: 'admin_001',
          userName: 'Admin User',
          email: credentials.email,
          loginTimestamp: new Date()
        };

        this.authState.set(newAuthState);
        this.saveAuthState();
        this.chatStateService.clearChat();
        this.router.navigate(['/admin']);
        return true;
      } else {
        return false; // Invalid admin credentials
      }
    }

    // Customer authentication - validate against registered users
    const user = this.registrationService.validateUser(credentials.email, credentials.password);
    if (user) {
      const newAuthState: AuthState = {
        isAuthenticated: true,
        userRole: 'customer',
        userId: user.id,
        userName: user.name,
        email: user.email,
        loginTimestamp: new Date()
      };

      this.authState.set(newAuthState);
      this.saveAuthState();
      this.chatStateService.clearChat();
      this.router.navigate(['/customer']);
      return true;
    }

    return false; // Invalid customer credentials
  }

  logout() {
    console.log('🚪 Logging out - clearing all session data for fresh start');
    
    // Clear chat state first
    this.chatStateService.clearChat();
    
    this.authState.set({
      isAuthenticated: false,
      userRole: null,
      userId: '',
      userName: '',
      email: '',
      loginTimestamp: new Date()
    });
    
    this.clearAuthState();
    
    // SELECTIVE CLEAR: Only clear session data, preserve users and PDF content
    const preserveKeys = ['registeredUsers', 'lastPdfExtraction', 'lastPdfFilename'];
    const toPreserve: {[key: string]: string | null} = {};
    
    // Save data to preserve
    preserveKeys.forEach(key => {
      toPreserve[key] = localStorage.getItem(key);
    });
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore preserved data
    Object.entries(toPreserve).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });
    
    console.log('✅ Session data cleared - users and PDF content preserved');
    
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  hasRole(role: 'customer' | 'admin'): boolean {
    return this.authState().userRole === role;
  }

  private saveAuthState() {
    localStorage.setItem('authState', JSON.stringify(this.authState()));
  }

  private loadAuthState() {
    const saved = localStorage.getItem('authState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.authState.set({
          ...parsed,
          loginTimestamp: new Date(parsed.loginTimestamp)
        });
      } catch (e) {
        this.clearAuthState();
      }
    }
  }

  private clearAuthState() {
    localStorage.removeItem('authState');
  }
}