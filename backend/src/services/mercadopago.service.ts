import { MercadoPagoConfig, Preference } from 'mercadopago';
import { env } from '../config/env';

// Configurar o SDK do Mercado Pago
let client: MercadoPagoConfig;

if (env.MERCADO_PAGO_ACCESS_TOKEN) {
  client = new MercadoPagoConfig({
    accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
    options: {
      timeout: 5000,
      idempotencyKey: 'abc' // Opcional
    }
  });
}

export class MercadoPagoService {
  /**
   * Cria uma preferência de pagamento (Link de Checkout Pro) para assinatura de um plano
   */
  async createSubscriptionPreference(companyId: string, companyName: string, plan: string, price: number): Promise<string> {
    if (!client) {
      throw new Error('Mercado Pago Access Token não configurado no backend.');
    }

    const preference = new Preference(client);

    try {
      // Cria a preferência de checkout com as informações do plano
      const response = await preference.create({
        body: {
          items: [
            {
              id: `plan_${plan}`,
              title: `Assinatura Plano ${plan.toUpperCase()} - ${companyName}`,
              quantity: 1,
              unit_price: price,
              currency_id: 'BRL',
            }
          ],
          external_reference: companyId, // Salva o ID da empresa para sabermos quem pagou no webhook
          back_urls: {
            success: 'http://localhost:5173/checkout?status=success',
            failure: 'http://localhost:5173/checkout?status=failure',
            pending: 'http://localhost:5173/checkout?status=pending'
          },
          auto_return: 'approved',
          // O webhook enviará uma notificação para essa URL (precisa ser exposta pra web via ngrok/vercel)
          notification_url: 'https://seusite.com/api/payments/webhook' 
        }
      });

      // Retorna o link para onde devemos redirecionar o usuário
      return response.init_point || '';
    } catch (error) {
      console.error('Erro ao criar preferência do Mercado Pago:', error);
      throw new Error('Não foi possível gerar o link de pagamento.');
    }
  }
}

export const mpService = new MercadoPagoService();
