export class WhatsAppService {
  /**
   * Generates a wa.me link for WhatsApp Web/App integration.
   * This is a simple client-side integration (Opção A).
   */
  static generateWaMeLink(phone: string, message: string): string {
    // Clean the phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  // TODO: Implement actual API integration (Opção B) in the future using libraries like whatsapp-web.js
}
