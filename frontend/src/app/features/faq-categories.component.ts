import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-faq-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="us-container us-py-6">
      <div class="us-text-center us-mb-6">
        <h1>Banking FAQ Categories</h1>
        <p class="us-text-secondary">Find answers to your banking questions by category</p>
      </div>
      
      <div class="us-grid-3 us-gap-4">
        <div class="us-card us-card-hover" *ngFor="let category of categories">
          <div class="us-card-body">
            <div class="us-flex us-items-center us-mb-3">
              <i [class]="category.icon" style="font-size: 2rem; color: var(--primary-blue);"></i>
              <h3 class="us-ml-3">{{ category.title }}</h3>
            </div>
            <p class="us-text-secondary us-mb-4">{{ category.description }}</p>
            <a [routerLink]="category.link" class="us-btn us-btn-primary">
              View {{ category.count }} FAQs
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .us-card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    }
  `]
})
export class FaqCategoriesComponent {
  categories = [
    {
      title: 'Account Management',
      description: 'Opening accounts, balance inquiries, account types, and account maintenance',
      icon: 'bi bi-person-circle',
      count: 45,
      link: '/account-faq'
    },
    {
      title: 'Cards & Payments',
      description: 'Credit cards, debit cards, payments, and card security',
      icon: 'bi bi-credit-card',
      count: 38,
      link: '/card-faq'
    },
    {
      title: 'Loans & Mortgages',
      description: 'Personal loans, auto loans, mortgages, and loan applications',
      icon: 'bi bi-house',
      count: 52,
      link: '/loan-faq'
    },
    {
      title: 'Money Transfers',
      description: 'Wire transfers, ACH, mobile payments, and international transfers',
      icon: 'bi bi-arrow-left-right',
      count: 29,
      link: '/transfer-faq'
    },
    {
      title: 'Fees & Charges',
      description: 'Account fees, transaction fees, and fee schedules',
      icon: 'bi bi-receipt',
      count: 24,
      link: '/fee-faq'
    },
    {
      title: 'Security & Fraud',
      description: 'Account security, fraud protection, and identity verification',
      icon: 'bi bi-shield-check',
      count: 31,
      link: '/security-faq'
    }
  ];
}