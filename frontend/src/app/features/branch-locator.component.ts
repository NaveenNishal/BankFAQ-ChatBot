import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-branch-locator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="us-container us-py-6">
      <div class="us-text-center us-mb-6">
        <h1>Find Branch & ATM Locations</h1>
        <p class="us-text-secondary">Locate the nearest branch or ATM to you</p>
      </div>
      
      <div class="us-card us-card-lg us-mb-6">
        <div class="us-card-body">
          <div class="us-grid-2 us-gap-4">
            <div>
              <label class="us-label">Enter ZIP Code or City</label>
              <input type="text" [(ngModel)]="searchLocation" class="us-input" placeholder="e.g., 10001 or New York, NY">
            </div>
            <div>
              <label class="us-label">Search Radius</label>
              <select [(ngModel)]="searchRadius" class="us-input">
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
              </select>
            </div>
          </div>
          <div class="us-flex us-gap-3 us-mt-4">
            <button (click)="searchBranches()" class="us-btn us-btn-primary">
              <i class="bi bi-building me-2"></i>Find Branches
            </button>
            <button (click)="searchATMs()" class="us-btn us-btn-secondary">
              <i class="bi bi-credit-card me-2"></i>Find ATMs
            </button>
          </div>
        </div>
      </div>
      
      <div class="us-grid-2 us-gap-6" *ngIf="showResults">
        <div>
          <h3>Branch Locations</h3>
          <div class="us-card us-mb-3" *ngFor="let branch of branches">
            <div class="us-card-body">
              <h4>{{ branch.name }}</h4>
              <p class="us-text-secondary">{{ branch.address }}</p>
              <div class="us-flex us-justify-between us-items-center">
                <span class="us-badge us-badge-success">{{ branch.distance }} miles</span>
                <div class="us-flex us-gap-2">
                  <button class="us-btn us-btn-sm us-btn-outline">Directions</button>
                  <button class="us-btn us-btn-sm us-btn-outline">Call</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3>ATM Locations</h3>
          <div class="us-card us-mb-3" *ngFor="let atm of atms">
            <div class="us-card-body">
              <h4>{{ atm.location }}</h4>
              <p class="us-text-secondary">{{ atm.address }}</p>
              <div class="us-flex us-justify-between us-items-center">
                <span class="us-badge us-badge-info">{{ atm.distance }} miles</span>
                <span class="us-badge" [class]="atm.available ? 'us-badge-success' : 'us-badge-warning'">
                  {{ atm.available ? 'Available' : 'Out of Service' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BranchLocatorComponent {
  searchLocation = '';
  searchRadius = '10';
  showResults = false;
  
  branches = [
    { name: 'Main Street Branch', address: '123 Main St, New York, NY 10001', distance: '0.3' },
    { name: 'Downtown Branch', address: '456 Broadway, New York, NY 10013', distance: '1.2' },
    { name: 'Midtown Branch', address: '789 5th Ave, New York, NY 10022', distance: '2.1' }
  ];
  
  atms = [
    { location: 'CVS Pharmacy', address: '321 1st Ave, New York, NY 10003', distance: '0.1', available: true },
    { location: 'Whole Foods Market', address: '654 2nd Ave, New York, NY 10003', distance: '0.4', available: true },
    { location: 'Shell Gas Station', address: '987 3rd Ave, New York, NY 10022', distance: '0.8', available: false }
  ];
  
  searchBranches() {
    this.showResults = true;
  }
  
  searchATMs() {
    this.showResults = true;
  }
}