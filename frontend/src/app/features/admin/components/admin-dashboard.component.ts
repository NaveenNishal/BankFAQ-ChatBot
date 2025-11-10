import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestDetailsComponent } from './request-details.component';
import { LiveChatComponent } from './live-chat.component';
import { ServiceRequestService } from '../../../services/service-request.service';
import { SessionArchiveService, ArchivedSession } from '../services/session-archive.service';
import { AuthService } from '../../auth/services/auth.service';
import { ServiceRequest } from '../../../shared/models/service-request.models';
import { ConfirmationModalComponent } from '../../../shared/ui/confirmation-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RequestDetailsComponent, LiveChatComponent, ConfirmationModalComponent],
  template: `
    <div class="admin-container">
      <!-- Header -->
      <div class="admin-header us-card">
        <div class="header-content">
          <div class="header-left">
            <i class="bi bi-shield-lock header-icon"></i>
            <div>
              <h2 class="header-title">Admin Dashboard</h2>
              <p class="header-subtitle">BankFAQ Admin Portal • {{ currentUser().userName }}</p>
            </div>
          </div>
          <div class="header-right">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">Online</span>
            </div>
            <button (click)="logout()" class="us-btn us-btn-secondary us-btn-sm">
              <i class="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </div>
      </div>

      <div class="admin-layout">
        <!-- Main Content (Left Column) -->
        <div class="main-content">
          <!-- Enhanced Stats Grid -->
          <div class="stats-section">
            <div class="stat-card">
              <div class="stat-icon stat-icon-primary">
                <i class="bi bi-inbox"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats().total }}</div>
                <div class="stat-label">Total Requests</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-info">
                <i class="bi bi-plus-circle"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats().new }}</div>
                <div class="stat-label">New</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-warning">
                <i class="bi bi-pencil-square"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats().inProgress }}</div>
                <div class="stat-label">In Progress</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-success">
                <i class="bi bi-check-circle"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stats().resolved }}</div>
                <div class="stat-label">Resolved</div>
              </div>
            </div>
          </div>

          <!-- Tabs and Filters -->
          <div class="controls-section us-card">
            <div class="tabs-row">
              <div class="tab-buttons">
                <button (click)="setTab('active')" [class]="getTabButtonClass('active')">
                  <i class="bi bi-list-ul"></i>
                  Active Requests ({{ getActiveRequestsCount() }})
                </button>
                <button (click)="setTab('archived')" [class]="getTabButtonClass('archived')">
                  <i class="bi bi-archive"></i>
                  Session History ({{ getArchivedRequestsCount() }})
                </button>
              </div>
              
              <div class="filter-buttons" *ngIf="currentTab() === 'active'">
                <button (click)="setFilter('all')" [class]="getFilterButtonClass('all')">All</button>
                <button (click)="setFilter('new')" [class]="getFilterButtonClass('new')">New ({{ stats().new }})</button>
                <button (click)="setFilter('in-progress')" [class]="getFilterButtonClass('in-progress')">In Progress ({{ stats().inProgress }})</button>
              </div>
            </div>
          </div>

          <!-- Service Requests Table -->
          <div class="requests-section us-card">
            <div class="table-header">
              <h5 class="table-title">
                <i class="bi" [class]="currentTab() === 'archived' ? 'bi-archive' : 'bi-list-ul'"></i>
                {{ currentTab() === 'archived' ? 'FAQ Sessions' : 'FAQ Support Requests' }}
                <span class="request-count">{{ filteredRequests().length }}</span>
              </h5>
            </div>
            
            <!-- Empty State -->
            <div class="empty-state" *ngIf="filteredRequests().length === 0">
              <div class="empty-icon">
                <i class="bi" [class]="currentTab() === 'archived' ? 'bi-archive' : 'bi-check-circle-fill'"></i>
              </div>
              <h6 class="empty-title">
                <span *ngIf="currentTab() === 'archived'">No FAQ sessions found</span>
                <span *ngIf="currentTab() !== 'archived'">All FAQ requests resolved. Great work!</span>
              </h6>
              <p class="empty-message">
                <span *ngIf="currentTab() === 'archived'">FAQ chat sessions will appear here after completion.</span>
                <span *ngIf="currentTab() !== 'archived' && currentFilter() === 'all'">No service requests need attention right now.</span>
                <span *ngIf="currentTab() !== 'archived' && currentFilter() !== 'all'">No {{ currentFilter() }} requests found.</span>
              </p>
            </div>

            <!-- Requests Table -->
            <div class="requests-table" *ngIf="filteredRequests().length > 0">
              <div class="table-headers">
                <div class="header-cell id-col">ID</div>
                <div class="header-cell customer-col">Customer</div>
                <div class="header-cell timestamp-col">Timestamp</div>
                <div class="header-cell reason-col">Reason</div>
                <div class="header-cell priority-col">Priority</div>
                <div class="header-cell status-col">Status</div>
                <div class="header-cell actions-col">Actions</div>
              </div>

              <div *ngFor="let request of filteredRequests(); trackBy: trackByRequestId" class="table-row" (click)="selectRequest(request)">
                <div class="cell id-col">
                  <span class="request-id">{{ request.id.slice(-8) }}</span>
                  <span *ngIf="isNewEscalation(request)" class="new-badge">NEW</span>
                </div>
                <div class="cell customer-col">
                  <div class="customer-info">
                    <div class="customer-name">{{ request.customerName }}</div>
                    <div class="customer-email">{{ request.customerEmail }}</div>
                  </div>
                </div>
                <div class="cell timestamp-col">
                  {{ getISTTimestamp(request.timestamp) }}
                </div>
                <div class="cell reason-col">
                  <span class="reason-text">{{ request.escalationReason || 'Auto-escalated' }}</span>
                </div>
                <div class="cell priority-col">
                  <span class="priority-badge" [class]="getPriorityBadgeClass(request.priority)">{{ request.priority || 'medium' }}</span>
                </div>
                <div class="cell status-col">
                  <span class="status-badge" [class]="getStatusBadgeClass(request.status)">
                    <span class="status-dot"></span>
                    {{ request.status | titlecase }}
                  </span>
                </div>
                <div class="cell actions-col">
                  <div class="action-buttons">
                    <button *ngIf="request.status === 'new'" (click)="startLiveChat(request); $event.stopPropagation()" class="action-btn live-chat">
                      <i class="bi bi-play-fill"></i>
                    </button>
                    <button *ngIf="request.status === 'new'" (click)="acknowledgeRequest(request.id); $event.stopPropagation()" class="action-btn primary">
                      <i class="bi bi-check-circle"></i>
                    </button>
                    <button *ngIf="request.status === 'in-progress'" (click)="resolveRequest(request.id); $event.stopPropagation()" class="action-btn success">
                      <i class="bi bi-check-square"></i>
                    </button>
                    <button (click)="selectRequest(request); $event.stopPropagation()" class="action-btn secondary">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

    </div>
    
    <!-- Request Details Modal/Panel -->
    <div class="details-overlay" *ngIf="selectedRequest | async" (click)="clearSelection()">
      <div class="details-panel" (click)="$event.stopPropagation()">
        <app-request-details 
          [request]="selectedRequest | async"
          (close)="clearSelection()">
        </app-request-details>
      </div>
    </div>
    
    <!-- Live Chat Modal -->
    <app-live-chat
      *ngIf="liveChatRequest()"
      [request]="liveChatRequest()"
      (close)="closeLiveChat()">
    </app-live-chat>
    
    <!-- Delete Confirmation Modal -->
    <app-confirmation-modal
      [isOpen]="showDeleteModal()"
      title="Confirm Deletion"
      message="Are you sure you want to permanently delete this service request? This action cannot be undone."
      confirmText="Delete Permanently"
      (confirmed)="deleteRequest()"
      (cancelled)="cancelDelete()">
    </app-confirmation-modal>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .admin-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    /* Header */
    .admin-header {
      padding: 1.5rem;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .header-icon {
      font-size: 2rem;
      color: var(--primary-blue);
    }
    
    .header-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .header-subtitle {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(40, 167, 69, 0.1);
      border-radius: 50px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--success-green);
      border-radius: 50%;
    }
    
    .status-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--success-green);
    }
    
    /* Single Column Layout */
    .admin-layout {
      display: block;
    }
    
    .main-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    /* Enhanced Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    
    .stat-icon-primary { background: rgba(10, 65, 197, 0.1); color: var(--primary-blue); }
    .stat-icon-info { background: rgba(13, 202, 240, 0.1); color: #0dcaf0; }
    .stat-icon-warning { background: rgba(255, 193, 7, 0.1); color: var(--warning-orange); }
    .stat-icon-success { background: rgba(40, 167, 69, 0.1); color: var(--success-green); }
    
    .stat-content {
      flex: 1;
    }
    
    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      color: var(--text-primary);
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
      margin-top: 0.25rem;
    }
    
    /* Controls Section */
    .controls-section {
      padding: 1.5rem;
    }
    
    .tabs-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .tab-buttons, .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    /* Requests Section */
    .requests-section {
      padding: 0;
      overflow: hidden;
    }
    
    .table-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      background: #f8f9fa;
    }
    
    .table-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .request-count {
      background: var(--text-secondary);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }
    
    .empty-icon {
      font-size: 4rem;
      color: var(--success-green);
      margin-bottom: 1rem;
    }
    
    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    
    .empty-message {
      color: var(--text-secondary);
      margin: 0;
    }
    
    /* Professional Table */
    .requests-table {
      display: flex;
      flex-direction: column;
    }
    
    .table-headers {
      display: grid;
      grid-template-columns: 120px 200px 140px 1fr 100px 120px 120px;
      background: #f8f9fa;
      border-bottom: 2px solid var(--border-light);
    }
    
    .header-cell {
      padding: 1rem 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .table-row {
      display: grid;
      grid-template-columns: 120px 200px 140px 1fr 100px 120px 120px;
      border-bottom: 1px solid var(--border-light);
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .table-row:hover {
      background: #f8f9fa;
    }
    
    .cell {
      padding: 1rem 0.75rem;
      display: flex;
      align-items: center;
    }
    
    .request-id {
      font-family: monospace;
      font-weight: 600;
      color: var(--primary-blue);
    }
    
    .new-badge {
      background: var(--action-red);
      color: white;
      font-size: 0.6rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.5rem;
      animation: pulse 2s infinite;
    }
    
    .customer-info {
      display: flex;
      flex-direction: column;
    }
    
    .customer-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .customer-email {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    
    .reason-text {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .priority-badge, .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .bg-primary .status-dot { background: #0d6efd; }
    .bg-warning .status-dot { background: #ffc107; }
    .bg-success .status-dot { background: #198754; }
    
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .action-btn.live-chat { background: rgba(255, 193, 7, 0.1); color: var(--warning-orange); }
    .action-btn.primary { background: rgba(10, 65, 197, 0.1); color: var(--primary-blue); }
    .action-btn.success { background: rgba(40, 167, 69, 0.1); color: var(--success-green); }
    .action-btn.secondary { background: rgba(108, 117, 125, 0.1); color: var(--text-secondary); }
    
    .action-btn:hover {
      transform: scale(1.1);
    }
    

    
    /* Details Overlay */
    .details-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .details-panel {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      max-height: 90vh;
      overflow: auto;
      margin: 2rem;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @media (max-width: 1200px) {
      .admin-layout {
        grid-template-columns: 1fr;
      }
      
      .sidebar {
        order: -1;
      }
    }
    
    @media (max-width: 768px) {
      .stats-section {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .table-headers, .table-row {
        grid-template-columns: 1fr;
      }
      
      .header-cell:not(:first-child),
      .cell:not(:first-child) {
        display: none;
      }
    }
  `]
})
export class AdminDashboardComponent {
  currentFilter = signal<'all' | 'new' | 'in-progress' | 'resolved' | 'archived'>('all');
  currentTab = signal<'active' | 'archived'>('active');
  showDeleteModal = signal(false);
  requestToDelete = signal<string | null>(null);
  archivedSessions = signal<ArchivedSession[]>([]);
  liveChatRequest = signal<ServiceRequest | null>(null);
  serviceRequests$ = this.serviceRequestService.serviceRequests$;
  
  constructor(
    public serviceRequestService: ServiceRequestService,
    public sessionArchiveService: SessionArchiveService,
    public authService: AuthService
  ) {
    // Load service requests from backend
    this.serviceRequestService.refreshServiceRequests();
    
    // Load archived sessions
    this.loadArchivedSessions();
    
    // Refresh service requests every 30 seconds
    setInterval(() => {
      this.serviceRequestService.refreshServiceRequests();
    }, 30000);
  }

  private checkForNewEscalations() {
    // Check localStorage for any escalations that might have been created
    const lastCheck = localStorage.getItem('adminLastCheck');
    const currentTime = Date.now();
    
    if (!lastCheck) {
      localStorage.setItem('adminLastCheck', currentTime.toString());
      return;
    }
    
    // Reload service requests to get latest data
    this.serviceRequestService.reloadEscalations();
  }

  private loadArchivedSessions() {
    this.sessionArchiveService.getArchivedSessions().subscribe({
      next: (sessions) => {
        this.archivedSessions.set(sessions);
        console.log(`📁 Loaded ${sessions.length} archived sessions for admin review`);
      },
      error: (err) => {
        console.error('Failed to load archived sessions:', err);
        this.archivedSessions.set([]);
      }
    });
  }

  get currentUser() {
    return this.authService.currentAuth;
  }

  get selectedRequest() {
    return this.serviceRequestService.selectedRequest;
  }

  logout() {
    this.authService.logout();
  }

  stats() {
    const requests = this.serviceRequestService.getServiceRequests();
    return {
      total: requests.length,
      new: requests.filter(req => req.status === 'new').length,
      inProgress: requests.filter(req => req.status === 'in-progress').length,
      resolved: requests.filter(req => req.status === 'resolved').length
    };
  }

  filteredRequests(): ServiceRequest[] {
    if (this.currentTab() === 'archived') {
      const resolvedRequests = this.serviceRequestService.getServiceRequests().filter(req => req.status === 'resolved');
      const archivedSessions = this.archivedSessions().map(session => ({
        id: session.session_id,
        customerId: session.user_id,
        customerName: `User ${session.user_id.slice(-8)}`,
        customerEmail: session.user_id,
        timestamp: new Date(session.archived_at),
        status: 'archived' as any,
        escalationReason: 'Session completed',
        priority: 'low' as any,
        chatHistory: session.messages.map(msg => ({
          id: msg.message_id || `${msg.role}_${msg.timestamp}`,
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: session.archived_at,
        lastUpdated: new Date(session.archived_at)
      } as ServiceRequest));
      return [...resolvedRequests, ...archivedSessions];
    }
    
    const requests = this.serviceRequestService.getServiceRequests();
    const filter = this.currentFilter();
    
    if (filter === 'all') {
      return requests.filter(req => req.status !== 'resolved');
    }
    return requests.filter(req => req.status === filter);
  }

  setFilter(filter: 'all' | 'new' | 'in-progress' | 'resolved') {
    this.currentFilter.set(filter);
    this.serviceRequestService.clearSelection();
  }

  setTab(tab: 'active' | 'archived') {
    this.currentTab.set(tab);
    this.currentFilter.set('all');
    this.serviceRequestService.clearSelection();
  }

  getActiveRequestsCount() {
    return this.serviceRequestService.getServiceRequests().filter(req => req.status !== 'resolved').length;
  }

  getArchivedRequestsCount() {
    const resolvedCount = this.serviceRequestService.getServiceRequests().filter(req => req.status === 'resolved').length;
    return resolvedCount + this.archivedSessions().length;
  }

  acknowledgeRequest(requestId: string) {
    this.serviceRequestService.acknowledgeRequest(requestId);
  }

  resolveRequest(requestId: string) {
    this.serviceRequestService.resolveRequest(requestId);
  }

  confirmDelete(requestId: string) {
    this.requestToDelete.set(requestId);
    this.showDeleteModal.set(true);
  }

  deleteRequest() {
    const requestId = this.requestToDelete();
    if (requestId) {
      this.serviceRequestService.deleteArchivedRequest(requestId);
    }
    this.cancelDelete();
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.requestToDelete.set(null);
  }

  selectRequest(request: ServiceRequest) {
    this.serviceRequestService.selectRequest(request);
  }

  clearSelection() {
    this.serviceRequestService.clearSelection();
  }

  getFilterButtonClass(filter: string): string {
    const baseClass = 'us-btn us-btn-secondary us-btn-sm';
    return this.currentFilter() === filter ? 'us-btn us-btn-primary us-btn-sm' : baseClass;
  }

  getTabButtonClass(tab: string): string {
    const baseClass = 'us-btn us-btn-secondary';
    return this.currentTab() === tab ? 'us-btn us-btn-primary' : baseClass;
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'new': return 'bg-primary';
      case 'in-progress': return 'bg-warning';
      case 'resolved': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority?: string): string {
    switch(priority) {
      case 'critical': return 'bg-danger text-white';
      case 'high': return 'bg-warning text-dark';
      case 'medium': return 'bg-info text-white';
      case 'low': return 'bg-secondary text-white';
      default: return 'bg-secondary text-white';
    }
  }

  trackByRequestId(index: number, request: ServiceRequest): string {
    return request.id;
  }

  isNewEscalation(request: ServiceRequest): boolean {
    // Consider escalations from last 5 minutes as "new"
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const timestamp = typeof request.timestamp === 'number' ? request.timestamp : new Date(request.timestamp).getTime();
    return timestamp > fiveMinutesAgo && request.status === 'new';
  }

  getISTTimestamp(timestamp: any): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getISTDate(timestamp: any): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getISTTime(timestamp: any): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getEscalationSourceLabel(source?: string): string {
    switch(source) {
      case 'rag_system': return 'AI System';
      case 'frontend_analysis': return 'Chat Analysis';
      case 'manual': return 'Manual';
      default: return 'Unknown';
    }
  }

  startLiveChat(request: ServiceRequest) {
    // Update request status to in-progress
    this.serviceRequestService.acknowledgeRequest(request.id);
    // Open live chat modal
    this.liveChatRequest.set(request);
  }

  closeLiveChat() {
    this.liveChatRequest.set(null);
  }


}