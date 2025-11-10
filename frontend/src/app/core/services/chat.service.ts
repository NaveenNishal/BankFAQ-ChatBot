import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslationService } from './translation.service';

export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
  escalation?: boolean;
  escalationLevel?: string;
}

export interface ChatResponse {
  response: string;
  escalation: boolean;
  escalation_level: string;
  escalation_reason: string;
  language: string;
  supported_languages: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8000';
  private messages: ChatMessage[] = [];

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  sendMessage(message: string, language?: string): Observable<ChatResponse> {
    const payload = {
      query: message,
      language: language || this.translationService.getCurrentLanguage()
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, payload);
  }

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  clearMessages(): void {
    this.messages = [];
  }

  getSupportedLanguages(): Observable<{ supported_languages: { [key: string]: string } }> {
    return this.http.get<{ supported_languages: { [key: string]: string } }>(`${this.apiUrl}/languages`);
  }
}