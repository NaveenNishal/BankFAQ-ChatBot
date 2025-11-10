import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-financial-education',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="us-container us-py-6">
      <div class="us-text-center us-mb-6">
        <h1>Financial Education Center</h1>
        <p class="us-text-secondary">Learn about banking, saving, and financial planning</p>
      </div>
      
      <div class="us-grid-2 us-gap-6 us-mb-6">
        <div class="us-card" *ngFor="let topic of educationTopics">
          <div class="us-card-body">
            <div class="us-flex us-items-center us-mb-3">
              <i [class]="topic.icon" style="font-size: 2rem; color: var(--primary-blue);"></i>
              <h3 class="us-ml-3">{{ topic.title }}</h3>
            </div>
            <p class="us-text-secondary us-mb-4">{{ topic.description }}</p>
            <div class="us-flex us-gap-2">
              <button class="us-btn us-btn-primary us-btn-sm">Learn More</button>
              <button class="us-btn us-btn-outline us-btn-sm">FAQ</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="us-card us-card-lg">
        <div class="us-card-body">
          <h3 class="us-mb-4">Popular Banking Questions</h3>
          <div class="us-accordion">
            <div class="us-accordion-item" *ngFor="let faq of popularFAQs">
              <div class="us-accordion-header" (click)="toggleFAQ(faq)">
                <span>{{ faq.question }}</span>
                <i class="bi" [class]="faq.expanded ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
              </div>
              <div class="us-accordion-content" *ngIf="faq.expanded">
                <p>{{ faq.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .us-accordion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-light);
      font-weight: 500;
    }
    .us-accordion-header:hover {
      background: var(--background-grey);
    }
    .us-accordion-content {
      padding: 1rem;
      background: var(--background-grey);
    }
  `]
})
export class FinancialEducationComponent {
  educationTopics = [
    {
      title: 'Banking Basics',
      description: 'Understanding checking accounts, savings accounts, and basic banking services',
      icon: 'bi bi-bank'
    },
    {
      title: 'Credit & Loans',
      description: 'Learn about credit scores, loan applications, and managing debt',
      icon: 'bi bi-credit-card'
    },
    {
      title: 'Saving & Investing',
      description: 'Building emergency funds, retirement planning, and investment options',
      icon: 'bi bi-piggy-bank'
    },
    {
      title: 'Digital Banking',
      description: 'Mobile banking, online security, and digital payment methods',
      icon: 'bi bi-phone'
    }
  ];
  
  popularFAQs = [
    {
      question: 'What is the difference between checking and savings accounts?',
      answer: 'Checking accounts are designed for frequent transactions and daily banking needs, while savings accounts are meant for storing money and earning interest over time.',
      expanded: false
    },
    {
      question: 'How do I improve my credit score?',
      answer: 'Pay bills on time, keep credit utilization low, maintain old accounts, and regularly check your credit report for errors.',
      expanded: false
    },
    {
      question: 'What fees should I expect with my bank account?',
      answer: 'Common fees include monthly maintenance fees, overdraft fees, ATM fees, and wire transfer fees. Many can be avoided by meeting certain requirements.',
      expanded: false
    }
  ];
  
  toggleFAQ(faq: any) {
    faq.expanded = !faq.expanded;
  }
}