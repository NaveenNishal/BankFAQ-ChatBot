import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <div class="modern-card p-4 mb-4">
        <h2 class="fw-bold d-flex align-items-center" style="color: var(--primary-navy);">
          <i class="bi bi-bar-chart fs-3 me-3"></i>
          Admin Dashboard
        </h2>
        <p class="text-muted">Monitor chatbot performance and security</p>
      </div>

      <div class="row g-4">
        <div class="col-md-6 col-lg-3">
          <div class="modern-card p-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <p class="text-muted small mb-1">Total Queries</p>
                <h3 class="fw-bold" style="color: var(--primary-navy);">1,247</h3>
              </div>
              <i class="bi bi-people fs-1 text-primary"></i>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 col-lg-3">
          <div class="modern-card p-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <p class="text-muted small mb-1">Escalations</p>
                <h3 class="fw-bold" style="color: var(--primary-navy);">23</h3>
              </div>
              <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {}