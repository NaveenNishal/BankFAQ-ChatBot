import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  escalated?: boolean;
  confidenceLevel?: string;
  confidenceScore?: number;
  feedbackGiven?: boolean;
  feedback?: 'like' | 'dislike';
}

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  private readonly messages = new BehaviorSubject<ChatMessage[]>([]);
  public readonly messages$ = this.messages.asObservable();

  addMessage(message: ChatMessage) {
    const currentMessages = this.messages.getValue();
    this.messages.next([...currentMessages, message]);
  }

  clearChat() {
    this.messages.next([]);
  }

  getMessages(): ChatMessage[] {
    return this.messages.getValue();
  }

  updateMessage(messageId: string, updates: Partial<ChatMessage>) {
    const currentMessages = this.messages.getValue();
    const updatedMessages = currentMessages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    this.messages.next(updatedMessages);
  }
}