import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mpService } from '../services/mercadopago.service';
import { pool } from '../config/db';

const router = Router();

/**
 * POST /api/payments/checkout
 * Cria a preferência de pagamento (Link Mercado Pago) e retorna para o Frontend
 */
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body; // 'start', 'basic', 'pro', 'annual'
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Busca os dados da empresa para exibir no Checkout
    const companyResult = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    const companyName = companyResult.rows[0].name;

    // Define o preço baseado no plano escolhido
    let price = 0;
    if (plan === 'start') price = 149.90;
    else if (plan === 'basic') price = 299.90;
    else if (plan === 'pro') price = 399.90;
    else if (plan === 'annual') price = 3999.90; // 12x com desconto
    else return res.status(400).json({ error: 'Plano inválido' });

    // Gera o link de pagamento
    const initPoint = await mpService.createSubscriptionPreference(companyId, companyName, plan, price);
    
    res.json({ initPoint });
  } catch (error: any) {
    console.error('Erro na rota de checkout:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao gerar pagamento' });
  }
});

/**
 * POST /api/payments/webhook
 * Recebe notificações assíncronas do Mercado Pago
 */
router.post('/webhook', async (req, res) => {
  try {
    const { action, data, type } = req.body;

    // A notificação de pagamento padrão tem type === 'payment' e data.id com o ID do pagamento
    if (type === 'payment' && data && data.id) {
      const paymentId = data.id;
      
      // NOTA: Em produção, devemos usar o MercadoPagoConfig para buscar os detalhes desse paymentId 
      // e confirmar se foi aprovado e pegar o external_reference (companyId).
      // Mas para o MVP simplificado, deixaremos preparado o esqueleto.
      
      console.log(`[WEBHOOK] Pagamento recebido! ID: ${paymentId}`);
    }

    // Retorna 200 pro MP saber que recebemos a notificação com sucesso e parar de re-enviar.
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no Webhook:', error);
    res.status(500).send('Erro interno');
  }
});

export default router;
