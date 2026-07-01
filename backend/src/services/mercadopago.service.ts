import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { env } from '../config/env';

// O cliente será inicializado sob demanda para evitar problemas de escopo/env
let client: MercadoPagoConfig | null = null;

function getClient() {
  if (!client && env.MERCADO_PAGO_ACCESS_TOKEN) {
    client = new MercadoPagoConfig({
      accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
      options: { timeout: 5000 }
    });
  }
  return client;
}

export class MercadoPagoService {
  /**
   * Cria uma preferência de pagamento (Link de Checkout Pro) para assinatura de um plano
   */
  async createSubscriptionPreference(companyId: string, companyName: string, plan: string, price: number): Promise<string> {
    const mpClient = getClient();
    if (!mpClient) {
      throw new Error('Aviso: Token do Mercado Pago não configurado no backend.');
    }

    const preference = new Preference(mpClient);

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
            success: `${env.FRONTEND_URL}/checkout?status=success`,
            failure: `${env.FRONTEND_URL}/checkout?status=failure`,
            pending: `${env.FRONTEND_URL}/checkout?status=pending`
          },
          auto_return: 'approved',
          // O webhook enviará uma notificação para essa URL (precisa ser exposta pra web via ngrok/vercel)
          notification_url: env.WEBHOOK_URL
        }
      });

      // Retorna o link para onde devemos redirecionar o usuário
      return response.init_point || '';
    } catch (error) {
      console.error('Erro ao criar preferência do Mercado Pago:', error);
      throw new Error('Não foi possível gerar o link de pagamento.');
    }
  }
  /**
   * Processa um pagamento transparente com cartão de crédito (Checkout Transparente)
   */
  async createPayment(companyId: string, email: string, token: string, installments: number, paymentMethodId: string, issuerId: string, payer: any, plan: string, price: number) {
    const mpClient = getClient();
    if (!mpClient) throw new Error('Mercado Pago Access Token não configurado.');

    const payment = new Payment(mpClient);

    try {
      const response = await payment.create({
        body: {
          transaction_amount: Number(price),
          token: token,
          description: `Assinatura Plano ${plan.toUpperCase()}`,
          installments: installments,
          payment_method_id: paymentMethodId,
          issuer_id: issuerId,
          payer: {
            email: email,
            identification: payer.identification
          },
          external_reference: companyId,
          additional_info: {
            items: [
              {
                id: `plan_${plan}`,
                title: `Assinatura Plano ${plan.toUpperCase()}`,
                description: `Mensalidade`,
                picture_url: '',
                category_id: 'services',
                quantity: 1,
                unit_price: Number(price)
              }
            ]
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Erro ao processar pagamento transparente:', error);
      throw new Error('Falha ao processar pagamento com a operadora do cartão.');
    }
  }
  /**
   * Busca as informações reais de um pagamento diretamente no servidor do Mercado Pago (Validação Reversa)
   */
  async verifyPayment(paymentId: string | number) {
    const mpClient = getClient();
    if (!mpClient) {
      throw new Error('Mercado Pago Access Token não configurado no backend.');
    }

    const payment = new Payment(mpClient);

    try {
      const response = await payment.get({ id: paymentId });
      
      return {
        id: response.id,
        status: response.status, // Ex: 'approved', 'pending', 'rejected'
        externalReference: response.external_reference, // O companyId que passamos na criação
        items: response.additional_info?.items || [],
        transactionAmount: response.transaction_amount,
      };
    } catch (error) {
      console.error(`Erro ao buscar pagamento ${paymentId} no Mercado Pago:`, error);
      throw new Error('Não foi possível validar o pagamento.');
    }
  }
}

export const mpService = new MercadoPagoService();
