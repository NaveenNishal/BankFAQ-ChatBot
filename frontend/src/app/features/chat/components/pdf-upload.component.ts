import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-upload-container">
      <input 
        #fileInput 
        type="file" 
        accept=".pdf" 
        (change)="onFileSelected($event)"
        style="display: none">
      
      <button 
        class="us-upload-btn"
        (click)="fileInput.click()"
        [disabled]="uploading"
        title="Upload PDF document">
        <i class="bi bi-paperclip"></i>
        <span *ngIf="uploading" class="upload-text">Uploading...</span>
      </button>
    </div>
  `,
  styles: [`
    .pdf-upload-container {
      display: inline-block;
    }
    
    .us-upload-btn {
      width: 56px;
      height: 56px;
      background: transparent;
      border: none;
      border-radius: 16px;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.2s ease;
    }
    
    .us-upload-btn:hover:not(:disabled) {
      background: #f8f9fa;
      color: var(--primary-blue);
    }
    
    .us-upload-btn:disabled {
      color: #6c757d;
      cursor: not-allowed;
    }
    
    .upload-text {
      font-size: 0.75rem;
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
    }
  `]
})
export class PdfUploadComponent {
  @Input() sessionId: string = '';
  @Output() uploadComplete = new EventEmitter<{filename: string, chunksCreated: number, extractedPreview?: string, fullText?: string}>();
  @Output() uploadError = new EventEmitter<string>();
  
  uploading = false;
  
  constructor(private http: HttpClient) {}
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      this.uploadError.emit('Please select a PDF file.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.uploadError.emit('File size must be less than 10MB.');
      return;
    }
    
    this.uploadPDF(file);
  }
  
  private uploadPDF(file: File) {
    this.uploading = true;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', this.sessionId || this.generateSessionId());
    
    this.http.post<any>(`${environment.apiUrl}/api/v1/upload-pdf`, formData)
      .subscribe({
        next: (response) => {
          this.uploading = false;
          if (response.success) {
            this.uploadComplete.emit({
              filename: response.filename,
              chunksCreated: response.chunksCreated,
              extractedPreview: response.extractedPreview,
              fullText: response.fullText
            });
          } else {
            this.uploadError.emit(response.error || 'Upload failed');
          }
        },
        error: (error) => {
          this.uploading = false;
          this.uploadError.emit('Upload failed: ' + (error.error?.error || error.message));
        }
      });
  }
  
  private generateSessionId(): string {
    return 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}