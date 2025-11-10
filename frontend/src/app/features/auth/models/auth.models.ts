export interface AuthState {
  isAuthenticated: boolean;
  userRole: 'customer' | 'admin' | null;
  userId: string;
  userName: string;
  email: string;
  loginTimestamp: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: 'customer' | 'admin';
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  registrationDate: Date;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: 'customer' | 'admin';
  token?: string;
}