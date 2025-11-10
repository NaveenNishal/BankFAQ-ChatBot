import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ArchivedSession {
  session_id: string;
  user_id: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
    message_id: string;
  }>;
  start_time: number;
  end_time: number;
  archived_at: number;
  message_count: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionArchiveService {
  constructor(private http: HttpClient) {}

  getArchivedSessions(): Observable<ArchivedSession[]> {
    return this.http.get<ArchivedSession[]>(`${environment.apiUrl}/api/v1/archived-sessions`);
  }

  getSessionById(sessionId: string): Observable<ArchivedSession> {
    return this.http.get<ArchivedSession>(`${environment.apiUrl}/api/v1/archived-sessions/${sessionId}`);
  }

  deleteArchivedSession(sessionId: string): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${environment.apiUrl}/api/v1/archived-sessions/${sessionId}`);
  }
}