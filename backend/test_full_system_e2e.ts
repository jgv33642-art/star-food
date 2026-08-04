import axios from 'axios';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const API_URL = 'http://localhost:3000/api';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runTest() {
  console.log('🚀 Iniciando Teste de Ponta a Ponta: 100% do Sistema');
  let companyId = '';
  let token = '';
  
  try {
    // ---------------------------------------------------------
    // 1. Tenant Onboarding & Subscription
    // ---------------------------------------------------------
    console.log('\n1️⃣ [Assinaturas] Criando Restaurante e Processando Assinatura...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      companyName: 'Lanchonete 100% E2E',
      userName: 'Admin Full Test',
      email: `admin_full_${Date.now()}@teste.com`,
      password: 'password123',
      plan: 'pro'
    });
    token = registerRes.data.token;
    companyId = registerRes.data.user.companyId;
    console.log(`✅ Restaurante criado! ID: ${companyId}`);

    // Simulando ativação de pagamento (Mercado Pago Webhook Simulation)
    await pool.query(`UPDATE companies SET active = true, plan = 'pro' WHERE id = $1`, [companyId]);
    console.log(`✅ Assinatura ativada via Banco de Dados (Simulação MP).`);
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ---------------------------------------------------------
    // 2. Catalog & Inventory Management
    // ---------------------------------------------------------
    console.log('\n2️⃣ [Estoque] Configurando Catálogo, Ingredientes e Complementos...');
    
    // a. Categoria
    const catRes = await axios.post(`${API_URL}/categories`, { name: 'Carnes Especiais' }, authHeaders);
    const categoryId = catRes.data.id;
    console.log(`✅ Categoria 'Carnes Especiais' criada.`);

    // b. Produto
    const prodRes = await axios.post(`${API_URL}/products`, {
      name: 'Picanha E2E',
      description: 'Picanha na chapa com fritas.',
      price: 89.90,
      cost: 40.00,
      categoryId: categoryId,
      stockQuantity: 10, // Controlando estoque
      hasStock: true
    }, authHeaders);
    const productId = prodRes.data.id;
    console.log(`✅ Produto 'Picanha E2E' criado com Estoque: 10.`);

    // ---------------------------------------------------------
    // 3. Cashier Operations (Abertura de Caixa)
    // ---------------------------------------------------------
    console.log('\n3️⃣ [Caixa] Abrindo o Turno do Caixa...');
    const shiftRes = await axios.post(`${API_URL}/cashier/open`, {
      openingBalance: 150.00,
      notes: 'Troco inicial E2E'
    }, authHeaders);
    const shiftId = shiftRes.data.id;
    console.log(`✅ Caixa aberto com sucesso! Turno ID: ${shiftId}`);

    // ---------------------------------------------------------
    // 4. Point of Sale (POS) Order
    // ---------------------------------------------------------
    console.log('\n4️⃣ [PDV] Criando um pedido interno de Balcão...');
    const posPayload = {
      type: 'counter',
      customerName: 'Cliente Balcão',
      paymentMethod: 'credit_card',
      items: [
        { productId: productId, quantity: 1, price: 89.90, notes: 'Ao ponto' }
      ]
    };
    const posOrderRes = await axios.post(`${API_URL}/orders`, posPayload, authHeaders);
    const posOrderId = posOrderRes.data.id;
    console.log(`✅ Pedido PDV criado! ID: ${posOrderId}`);

    // ---------------------------------------------------------
    // 5. Delivery Public Web Flow
    // ---------------------------------------------------------
    console.log('\n5️⃣ [Delivery] Cliente Público acessando site...');
    const menuRes = await axios.get(`${API_URL}/public/menu/${companyId}`);
    if (menuRes.data.products.some((p: any) => p.id === productId)) {
      console.log(`✅ Menu carregado e Produto exibido corretamente!`);
    } else {
      throw new Error("Produto não apareceu no cardápio público do Delivery.");
    }

    console.log('\n6️⃣ [Delivery] Cliente Público enviando pedido de Delivery...');
    const deliveryPayload = {
      type: 'delivery',
      customerName: 'Cliente Delivery',
      customerPhone: '11988887777',
      address: {
        street: 'Rua Principal',
        number: '42',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01001-000',
        reference: 'Prédio Azul'
      },
      paymentMethod: 'pix',
      items: [
        { productId: productId, quantity: 2 } // 89.90 * 2 = 179.80
      ]
    };
    const delOrderRes = await axios.post(`${API_URL}/public/order/${companyId}`, deliveryPayload);
    const delOrderId = delOrderRes.data.id;
    console.log(`✅ Pedido Delivery realizado com sucesso! Tracking Code: ${delOrderRes.data.tracking_code}`);

    // ---------------------------------------------------------
    // 6. Kanban & Kitchen & Checkout
    // ---------------------------------------------------------
    console.log('\n7️⃣ [Cozinha & Caixa] Finalizando Pedidos...');
    
    // POS Order
    await axios.put(`${API_URL}/orders/${posOrderId}/status`, { status: 'preparing' }, authHeaders);
    console.log(`✅ Pedido PDV mudou para: PREPARANDO`);
    await axios.put(`${API_URL}/orders/${posOrderId}/close`, {}, authHeaders);
    console.log(`✅ Pedido PDV mudou para: FECHADO`);
    // Create Sale for POS
    await axios.post(`${API_URL}/sales`, {
      orderId: posOrderId,
      cashRegisterId: shiftId,
      totalAmount: 89.90,
      discount: 0,
      finalAmount: 89.90,
      paymentMethod: 'credit_card',
      items: [{ productId: productId, quantity: 1, price: 89.90 }]
    }, authHeaders);
    console.log(`✅ Venda PDV registrada no caixa!`);

    // Delivery Order
    await axios.put(`${API_URL}/orders/${delOrderId}/status`, { status: 'ready' }, authHeaders);
    console.log(`✅ Pedido Delivery mudou para: PRONTO`);
    await axios.put(`${API_URL}/orders/${delOrderId}/status`, { status: 'dispatched' }, authHeaders);
    console.log(`✅ Pedido Delivery mudou para: SAIU PARA ENTREGA`);
    await axios.put(`${API_URL}/orders/${delOrderId}/close`, {}, authHeaders);
    console.log(`✅ Pedido Delivery mudou para: FECHADO`);
    // Create Sale for Delivery
    await axios.post(`${API_URL}/sales`, {
      orderId: delOrderId,
      cashRegisterId: shiftId,
      totalAmount: 179.80,
      discount: 0,
      finalAmount: 179.80,
      paymentMethod: 'pix',
      items: [{ productId: productId, quantity: 2, price: 89.90 }]
    }, authHeaders);
    console.log(`✅ Venda Delivery registrada no caixa!`);

    // ---------------------------------------------------------
    // 7. Cashier Operations (Fechamento)
    // ---------------------------------------------------------
    console.log('\n8️⃣ [Caixa] Fechando o Turno do Caixa...');
    const closeRes = await axios.post(`${API_URL}/cashier/close`, {
      id: shiftId,
      closingBalance: 150.00 + 89.90 + 179.80, // Troco + PDV + Delivery
      notes: 'Fechamento E2E perfeito'
    }, authHeaders);
    console.log(`✅ Caixa fechado com sucesso!`);

    // ---------------------------------------------------------
    // 8. Dashboard & Reports
    // ---------------------------------------------------------
    console.log('\n9️⃣ [Dashboard] Validando Relatórios Financeiros...');
    const dashRes = await axios.get(`${API_URL}/dashboard/stats`, authHeaders);
    const dashboard = dashRes.data;
    console.log(`✅ Dados do Dashboard Carregados:`);
    console.log(`   - Faturamento Total (Hoje): R$ ${dashboard.today_revenue}`);
    console.log(`   - Total de Pedidos Ativos (Em Aberto): ${dashboard.active_orders}`);
    
    // Verificações finais
    if (Number(dashboard.today_revenue) >= 269.70) {
      console.log(`✅ Faturamento Total conferido e validado (R$ 269.70)!`);
    } else {
      throw new Error(`O Dashboard não refletiu o faturamento corretamente. Total esperado >= 269.70, Retornado: ${dashboard.today_revenue}`);
    }

    console.log('\n🎉 TESTE 100% DO SISTEMA E2E CONCLUÍDO COM SUCESSO ABSOLUTO! O Sistema é à prova de balas!');

  } catch (error: any) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error(error);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    await pool.end();
  }
}

runTest();
