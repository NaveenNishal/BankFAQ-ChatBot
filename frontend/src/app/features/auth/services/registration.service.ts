import { Injectable } from '@angular/core';
import { UserRegistration } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly USERS_KEY = 'registeredUsers';

  register(registration: UserRegistration): boolean {
    try {
      // Check if email already exists
      if (this.emailExists(registration.email)) {
        return false;
      }

      // Get existing users
      const users = this.getRegisteredUsers();
      
      // Add new user
      const newUser = {
        id: 'user_' + Date.now(),
        name: registration.name,
        email: registration.email,
        password: registration.password, // In production, this would be hashed
        registrationDate: registration.registrationDate,
        role: 'customer'
      };

      users.push(newUser);
      
      // Save to localStorage
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  emailExists(email: string): boolean {
    const users = this.getRegisteredUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  validateUser(email: string, password: string): any {
    const users = this.getRegisteredUsers();
    return users.find(user => 
      user.email.toLowerCase() === email.toLowerCase() && 
      user.password === password
    );
  }

  private getRegisteredUsers(): any[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      return [];
    }
  }
}