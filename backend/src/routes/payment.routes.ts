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
 * POST /api/payments/transparent
 * Processa o pagamento transparente via Cartão de Crédito
 */
router.post('/transparent', authMiddleware, async (req, res) => {
  try {
    const { plan, token, issuer_id, payment_method_id, installments, payer, email } = req.body;
    const companyId = req.user?.companyId;
    
    if (!companyId) return res.status(401).json({ error: 'Usuário não autenticado' });

    let price = 0;
    if (plan === 'start') price = 149.90;
    else if (plan === 'basic') price = 299.90;
    else if (plan === 'pro') price = 399.90;
    else if (plan === 'annual') price = 3999.90;
    else return res.status(400).json({ error: 'Plano inválido' });

    const response = await mpService.createPayment(
      companyId, email, token, installments, payment_method_id, issuer_id, payer, plan, price
    );

    // Se o pagamento for aprovado (ou pré-aprovado), já libera a conta instantaneamente
    if (response.status === 'approved' || response.status === 'authorized') {
      await pool.query(`
        UPDATE companies 
        SET plan = $1, active = true, updated_at = NOW() 
        WHERE id = $2
      `, [plan, companyId]);
    }

    res.json({ status: response.status, id: response.id });
  } catch (error: any) {
    console.error('Erro no checkout transparente:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar pagamento' });
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
    if ((type === 'payment' || req.body.topic === 'payment') && data && data.id) {
      const paymentId = data.id;
      
      console.log(`[WEBHOOK] Pagamento notificado! ID: ${paymentId}. Iniciando validação reversa...`);
      
      // 1. Validação Reversa: Busca no servidor do MP a veracidade desse ID
      const verifiedPayment = await mpService.verifyPayment(paymentId);
      
      // 2. Se for aprovado, atualizar banco de dados
      if (verifiedPayment.status === 'approved' && verifiedPayment.externalReference) {
        const companyId = verifiedPayment.externalReference;
        
        // Determinar o plano pago (item plan_xxx)
        let purchasedPlan = 'basic'; // fallback
        const item = verifiedPayment.items?.find((i: any) => i.id?.startsWith('plan_'));
        if (item) {
          purchasedPlan = item.id.replace('plan_', '');
        }

        // 3. Proteção contra concorrência e Idempotência com Transação
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // FOR UPDATE trava a linha da empresa para evitar duplo update simultâneo
          const companyRes = await client.query('SELECT plan FROM companies WHERE id = $1 FOR UPDATE', [companyId]);
          
          if (companyRes.rows.length > 0) {
            // Atualizar o plano para o que foi pago
            await client.query(`
              UPDATE companies 
              SET plan = $1, 
                  active = true, 
                  updated_at = NOW() 
              WHERE id = $2
            `, [purchasedPlan, companyId]);
            
            await client.query('COMMIT');
            console.log(`[WEBHOOK] Sucesso! Empresa ${companyId} atualizada para plano ${purchasedPlan.toUpperCase()}.`);
          } else {
            await client.query('ROLLBACK');
            console.log(`[WEBHOOK] Aviso: Empresa ${companyId} não encontrada no banco.`);
          }
        } catch (dbError) {
          await client.query('ROLLBACK');
          throw dbError;
        } finally {
          client.release();
        }
      } else {
        console.log(`[WEBHOOK] Pagamento ${paymentId} ignorado pois status é: ${verifiedPayment.status}`);
      }
    }

    // Retorna 200 pro MP saber que recebemos a notificação com sucesso e parar de re-enviar.
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no Webhook:', error);
    res.status(500).send('Erro interno');
  }
});

export default router;
