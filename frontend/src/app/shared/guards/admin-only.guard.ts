import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminOnlyGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentAuth = this.authService.currentAuth();
    
    if (currentAuth.isAuthenticated && currentAuth.userRole === 'admin') {
      return true;
    }
    
    // Redirect unauthorized users to login
    this.router.navigate(['/login']);
    return false;
  }
}