import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface LiveChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sender: 'customer' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<LiveChatMessage>();
  private connectionSubject = new Subject<boolean>();
  
  isConnected = signal(false);
  messages$ = this.messageSubject.asObservable();
  connection$ = this.connectionSubject.asObservable();

  connect(serviceRequestId: string, userType: 'customer' | 'admin') {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`ws://localhost:8093/ws/chat/${serviceRequestId}?type=${userType}`);
    
    this.ws.onopen = () => {
      this.isConnected.set(true);
      this.connectionSubject.next(true);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageSubject.next(message);
    };

    this.ws.onclose = () => {
      this.isConnected.set(false);
      this.connectionSubject.next(false);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected.set(false);
      this.connectionSubject.next(false);
    };
  }

  sendMessage(content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ content }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}