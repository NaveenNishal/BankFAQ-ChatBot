import { Component, OnInit } from '@angular/core';
import { ChatService } from '../chat/chat.service';

interface EscalationData {
  id: string;
  query: string;
  timestamp: Date;
  riskType: string;
  status: string;
}

interface MetricData {
  totalQueries: number;
  escalationRate: number;
  avgConfidence: number;
  piiDetections: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  
  metrics: MetricData = {
    totalQueries: 0,
    escalationRate: 0,
    avgConfidence: 0,
    piiDetections: 0
  };

  escalations: EscalationData[] = [];
  isLoading = true;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Simulate loading dashboard data
    setTimeout(() => {
      this.metrics = {
        totalQueries: 1247,
        escalationRate: 12.3,
        avgConfidence: 87.5,
        piiDetections: 23
      };

      this.escalations = [
        {
          id: 'ESC001',
          query: 'Someone stole my credit card',
          timestamp: new Date(Date.now() - 3600000),
          riskType: 'fraud',
          status: 'pending'
        },
        {
          id: 'ESC002', 
          query: 'Why was my loan rejected?',
          timestamp: new Date(Date.now() - 7200000),
          riskType: 'loan_rejection',
          status: 'resolved'
        }
      ];

      this.isLoading = false;
    }, 1000);
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'pending': return 'bg-warning';
      case 'resolved': return 'bg-success';
      case 'escalated': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getRiskTypeIcon(riskType: string): string {
    switch(riskType) {
      case 'fraud': return 'bi-shield-exclamation';
      case 'stolen_card': return 'bi-credit-card';
      case 'loan_rejection': return 'bi-bank';
      default: return 'bi-exclamation-triangle';
    }
  }
}