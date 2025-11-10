import { Routes } from '@angular/router';
import { AdminOnlyGuard } from './shared/guards/admin-only.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'customer',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/components/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AdminOnlyGuard]
  },
  {
    path: 'chat',
    redirectTo: '/customer'
  },
  {
    path: 'faq-categories',
    loadComponent: () => import('./features/faq-categories.component').then(m => m.FaqCategoriesComponent)
  },
  {
    path: 'branch-locator',
    loadComponent: () => import('./features/branch-locator.component').then(m => m.BranchLocatorComponent)
  },
  {
    path: 'contact-support',
    loadComponent: () => import('./features/contact-support.component').then(m => m.ContactSupportComponent)
  },
  {
    path: 'financial-education',
    loadComponent: () => import('./features/financial-education.component').then(m => m.FinancialEducationComponent)
  },
  {
    path: 'account-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'card-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'loan-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'transfer-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'fee-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'mortgage-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: 'credit-card-faq',
    loadComponent: () => import('./features/chat/components/chat-container.component').then(m => m.ChatContainerComponent)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];