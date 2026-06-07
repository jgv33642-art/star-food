export class WhatsAppService {
  async sendDeliveryNotification(customerPhone: string, customerName: string | null, orderId: string) {
    if (!customerPhone) return;
    
    const name = customerName || 'Cliente';
    const message = `Olá ${name}! O seu pedido #${orderId.substring(0, 8)} saiu para entrega e está a caminho! 🛵`;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\n======================================================');
    console.log('📱 [WHATSAPP MOCK] MENSAGEM ENVIADA');
    console.log(`Para: ${customerPhone}`);
    console.log(`Mensagem: ${message}`);
    console.log('======================================================\n');
  }
}
