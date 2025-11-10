import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguage.asObservable();
  
  private escalationRequired = new Subject<void>();
  public escalationRequired$ = this.escalationRequired.asObservable();
  
  private translations: { [key: string]: { [key: string]: string } } = {
    en: {
      'chat.placeholder': 'Ask me about banking...',
      'chat.send': 'Send',
      'chat.typing': 'Assistant is typing...',
      'language.select': 'Select Language',
      'escalation.title': 'Need Human Assistance?',
      'escalation.message': 'It looks like you might need help from a human representative.',
      'escalation.connect': 'Connect to Agent',
      'escalation.continue': 'Continue with AI',
      'header.title': 'Banking Assistant',
      'footer.powered': 'Powered by Amazon Q'
    },
    es: {
      'chat.placeholder': 'Pregúntame sobre banca...',
      'chat.send': 'Enviar',
      'chat.typing': 'El asistente está escribiendo...',
      'language.select': 'Seleccionar Idioma',
      'escalation.title': '¿Necesita Asistencia Humana?',
      'escalation.message': 'Parece que podría necesitar ayuda de un representante humano.',
      'escalation.connect': 'Conectar con Agente',
      'escalation.continue': 'Continuar con IA',
      'header.title': 'Asistente Bancario',
      'footer.powered': 'Desarrollado por Amazon Q'
    },
    fr: {
      'chat.placeholder': 'Demandez-moi des informations bancaires...',
      'chat.send': 'Envoyer',
      'chat.typing': 'L\'assistant tape...',
      'language.select': 'Sélectionner la Langue',
      'escalation.title': 'Besoin d\'Assistance Humaine?',
      'escalation.message': 'Il semble que vous pourriez avoir besoin d\'aide d\'un représentant humain.',
      'escalation.connect': 'Connecter à un Agent',
      'escalation.continue': 'Continuer avec l\'IA',
      'header.title': 'Assistant Bancaire',
      'footer.powered': 'Alimenté par Amazon Q'
    },
    de: {
      'chat.placeholder': 'Fragen Sie mich über Banking...',
      'chat.send': 'Senden',
      'chat.typing': 'Assistent tippt...',
      'language.select': 'Sprache Auswählen',
      'escalation.title': 'Menschliche Hilfe Benötigt?',
      'escalation.message': 'Es scheint, als könnten Sie Hilfe von einem menschlichen Vertreter benötigen.',
      'escalation.connect': 'Mit Agent Verbinden',
      'escalation.continue': 'Mit KI Fortfahren',
      'header.title': 'Banking Assistent',
      'footer.powered': 'Unterstützt von Amazon Q'
    },
    zh: {
      'chat.placeholder': '询问我银行相关问题...',
      'chat.send': '发送',
      'chat.typing': '助手正在输入...',
      'language.select': '选择语言',
      'escalation.title': '需要人工协助？',
      'escalation.message': '看起来您可能需要人工代表的帮助。',
      'escalation.connect': '连接客服',
      'escalation.continue': '继续使用AI',
      'header.title': '银行助手',
      'footer.powered': '由Amazon Q提供支持'
    }
  };
  
  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }
  
  setLanguage(language: string): void {
    if (this.translations[language]) {
      this.currentLanguage.next(language);
    }
  }
  
  getTranslation(key: string): string {
    const lang = this.currentLanguage.value;
    return this.translations[lang]?.[key] || this.translations['en'][key] || key;
  }
  
  getSupportedLanguages(): { [key: string]: string } {
    return {
      'en': 'English',
      'es': 'Español', 
      'fr': 'Français',
      'de': 'Deutsch',
      'zh': '中文'
    };
  }
  
  triggerEscalation(): void {
    this.escalationRequired.next();
  }
}