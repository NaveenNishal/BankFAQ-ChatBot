"""
Lightweight offline translation system for banking terms
Fast, reliable, and doesn't require external API calls
"""

class OfflineTranslator:
    def __init__(self):
        # Banking-specific translation dictionary
        self.translations = {
            # English to Spanish
            'en_to_es': {
                'password': 'contraseña',
                'reset': 'restablecer',
                'account': 'cuenta',
                'balance': 'saldo',
                'transfer': 'transferir',
                'payment': 'pago',
                'card': 'tarjeta',
                'bank': 'banco',
                'loan': 'préstamo',
                'deposit': 'depósito',
                'withdrawal': 'retiro',
                'transaction': 'transacción',
                'help': 'ayuda',
                'support': 'soporte',
                'customer service': 'servicio al cliente',
                'complaint': 'queja',
                'angry': 'enojado',
                'frustrated': 'frustrado',
                'terrible': 'terrible',
                'awful': 'horrible',
                'emergency': 'emergencia',
                'urgent': 'urgente',
                'manager': 'gerente',
                'representative': 'representante',
                'fraud': 'fraude',
                'stolen': 'robado',
                'error': 'error',
                'problem': 'problema',
                'issue': 'problema',
                'money': 'dinero',
                'cash': 'efectivo',
                'credit': 'crédito',
                'debit': 'débito',
                'pin': 'pin',
                'atm': 'cajero automático',
                'branch': 'sucursal',
                'online banking': 'banca en línea',
                'mobile app': 'aplicación móvil'
            },
            
            # English to French
            'en_to_fr': {
                'password': 'mot de passe',
                'reset': 'réinitialiser',
                'account': 'compte',
                'balance': 'solde',
                'transfer': 'transférer',
                'payment': 'paiement',
                'card': 'carte',
                'bank': 'banque',
                'loan': 'prêt',
                'deposit': 'dépôt',
                'withdrawal': 'retrait',
                'transaction': 'transaction',
                'help': 'aide',
                'support': 'support',
                'customer service': 'service client',
                'complaint': 'plainte',
                'angry': 'en colère',
                'frustrated': 'frustré',
                'terrible': 'terrible',
                'awful': 'affreux',
                'emergency': 'urgence',
                'urgent': 'urgent',
                'manager': 'directeur',
                'representative': 'représentant',
                'fraud': 'fraude',
                'stolen': 'volé',
                'error': 'erreur',
                'problem': 'problème',
                'issue': 'problème',
                'money': 'argent',
                'cash': 'espèces',
                'credit': 'crédit',
                'debit': 'débit',
                'pin': 'code pin',
                'atm': 'distributeur automatique',
                'branch': 'agence',
                'online banking': 'banque en ligne',
                'mobile app': 'application mobile'
            },
            
            # English to German
            'en_to_de': {
                'password': 'passwort',
                'reset': 'zurücksetzen',
                'account': 'konto',
                'balance': 'saldo',
                'transfer': 'übertragen',
                'payment': 'zahlung',
                'card': 'karte',
                'bank': 'bank',
                'loan': 'darlehen',
                'deposit': 'einzahlung',
                'withdrawal': 'abhebung',
                'transaction': 'transaktion',
                'help': 'hilfe',
                'support': 'unterstützung',
                'customer service': 'kundendienst',
                'complaint': 'beschwerde',
                'angry': 'wütend',
                'frustrated': 'frustriert',
                'terrible': 'schrecklich',
                'awful': 'furchtbar',
                'emergency': 'notfall',
                'urgent': 'dringend',
                'manager': 'manager',
                'representative': 'vertreter',
                'fraud': 'betrug',
                'stolen': 'gestohlen',
                'error': 'fehler',
                'problem': 'problem',
                'issue': 'problem',
                'money': 'geld',
                'cash': 'bargeld',
                'credit': 'kredit',
                'debit': 'lastschrift',
                'pin': 'pin',
                'atm': 'geldautomat',
                'branch': 'filiale',
                'online banking': 'online-banking',
                'mobile app': 'mobile app'
            },
            
            # English to Chinese (simplified)
            'en_to_zh': {
                'password': '密码',
                'reset': '重置',
                'account': '账户',
                'balance': '余额',
                'transfer': '转账',
                'payment': '付款',
                'card': '卡',
                'bank': '银行',
                'loan': '贷款',
                'deposit': '存款',
                'withdrawal': '取款',
                'transaction': '交易',
                'help': '帮助',
                'support': '支持',
                'customer service': '客户服务',
                'complaint': '投诉',
                'angry': '生气',
                'frustrated': '沮丧',
                'terrible': '糟糕',
                'awful': '可怕',
                'emergency': '紧急',
                'urgent': '紧急',
                'manager': '经理',
                'representative': '代表',
                'fraud': '欺诈',
                'stolen': '被盗',
                'error': '错误',
                'problem': '问题',
                'issue': '问题',
                'money': '钱',
                'cash': '现金',
                'credit': '信用',
                'debit': '借记',
                'pin': '密码',
                'atm': '自动取款机',
                'branch': '分行',
                'online banking': '网上银行',
                'mobile app': '手机应用'
            }
        }
        
        # Common banking phrases
        self.phrase_translations = {
            'en_to_es': {
                'how do i reset my password': 'cómo restablezco mi contraseña',
                'i need help': 'necesito ayuda',
                'transfer money': 'transferir dinero',
                'check balance': 'verificar saldo',
                'customer service': 'servicio al cliente',
                'i am angry': 'estoy enojado',
                'this is terrible': 'esto es terrible',
                'i need a manager': 'necesito un gerente',
                'my card is stolen': 'mi tarjeta fue robada',
                'there is an error': 'hay un error'
            },
            'en_to_fr': {
                'how do i reset my password': 'comment réinitialiser mon mot de passe',
                'comment changer le mot de passe': 'how to change password',
                'i need help': 'j\'ai besoin d\'aide',
                'transfer money': 'transférer de l\'argent',
                'check balance': 'vérifier le solde',
                'customer service': 'service client',
                'i am angry': 'je suis en colère',
                'this is terrible': 'c\'est terrible',
                'i need a manager': 'j\'ai besoin d\'un directeur',
                'my card is stolen': 'ma carte est volée',
                'there is an error': 'il y a une erreur'
            },
            'fr_to_en': {
                'comment changer le mot de passe': 'how to change password',
                'comment réinitialiser mon mot de passe': 'how do i reset my password',
                'j\'ai besoin d\'aide': 'i need help',
                'transférer de l\'argent': 'transfer money',
                'vérifier le solde': 'check balance',
                'service client': 'customer service'
            },
            'en_to_de': {
                'how do i reset my password': 'wie setze ich mein passwort zurück',
                'i need help': 'ich brauche hilfe',
                'transfer money': 'geld überweisen',
                'check balance': 'saldo prüfen',
                'customer service': 'kundendienst',
                'i am angry': 'ich bin wütend',
                'this is terrible': 'das ist schrecklich',
                'i need a manager': 'ich brauche einen manager',
                'my card is stolen': 'meine karte wurde gestohlen',
                'there is an error': 'es gibt einen fehler'
            },
            'en_to_zh': {
                'how do i reset my password': '如何重置我的密码',
                'i need help': '我需要帮助',
                'transfer money': '转账',
                'check balance': '查询余额',
                'customer service': '客户服务',
                'i am angry': '我很生气',
                'this is terrible': '这太糟糕了',
                'i need a manager': '我需要经理',
                'my card is stolen': '我的卡被盗了',
                'there is an error': '有错误'
            }
        }
    
    def detect_language(self, text):
        """Simple language detection based on character patterns"""
        text_lower = text.lower()
        
        # Spanish indicators
        if any(char in text for char in 'ñáéíóúü¿¡') or any(word in text_lower for word in ['cómo', 'qué', 'dónde', 'cuándo', 'por qué']):
            return 'es'
        
        # French indicators  
        if any(char in text for char in 'àâäéèêëïîôöùûüÿç') or any(word in text_lower for word in ['comment', 'où', 'quand', 'pourquoi']):
            return 'fr'
        
        # German indicators
        if any(char in text for char in 'äöüß') or any(word in text_lower for word in ['wie', 'was', 'wo', 'wann', 'warum']):
            return 'de'
        
        # Chinese indicators
        if any('\u4e00' <= char <= '\u9fff' for char in text):
            return 'zh'
        
        return 'en'
    
    def translate_word(self, word, target_lang, source_lang='en'):
        """Translate individual words"""
        if source_lang == target_lang:
            return word
        
        translation_key = f"{source_lang}_to_{target_lang}"
        if translation_key in self.translations:
            return self.translations[translation_key].get(word.lower(), word)
        
        return word
    
    def translate_phrase(self, phrase, target_lang, source_lang='en'):
        """Translate common banking phrases"""
        if source_lang == target_lang:
            return phrase
        
        translation_key = f"{source_lang}_to_{target_lang}"
        phrase_lower = phrase.lower().strip()
        
        if translation_key in self.phrase_translations:
            return self.phrase_translations[translation_key].get(phrase_lower, phrase)
        
        return phrase
    
    def translate_text(self, text, target_lang='en', source_lang='auto'):
        """Main translation function"""
        if source_lang == 'auto':
            source_lang = self.detect_language(text)
        
        if source_lang == target_lang:
            return text
        
        # Try phrase translation first
        phrase_result = self.translate_phrase(text, target_lang, source_lang)
        if phrase_result != text:
            return phrase_result
        
        # Fall back to word-by-word translation for banking terms
        words = text.split()
        translated_words = []
        
        for word in words:
            # Clean word (remove punctuation for translation, but keep it)
            clean_word = ''.join(c for c in word if c.isalnum())
            punctuation = ''.join(c for c in word if not c.isalnum())
            
            if clean_word:
                translated_word = self.translate_word(clean_word, target_lang, source_lang)
                translated_words.append(translated_word + punctuation)
            else:
                translated_words.append(word)
        
        return ' '.join(translated_words)
    
    def get_supported_languages(self):
        """Return supported language codes"""
        return ['en', 'es', 'fr', 'de', 'zh']