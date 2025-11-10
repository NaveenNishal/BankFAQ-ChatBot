import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  escalated?: boolean;
  confidenceScore?: number;
  confidenceLevel?: string;
  piiDetected?: boolean;
}

export interface ChatRequest {
  query: string;
  userId?: string;
  sessionId?: string;
  language?: string;
}

export interface ChatResponse {
  response: string;
  escalated: boolean;
  queryId: string;
  escalationId?: string;
  language?: string;
  piiDetected?: boolean;
  confidenceLevel?: string;
  confidenceScore?: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, request);
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}