import assert from 'assert';
import http from 'http';
import app from '../../src/app';
import { pool } from '../../src/config/db';

async function runMegaTests() {
  console.log('=== Início da Varredura Total (Mega Teste) ===');
  
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testEmail = `mega_${randomSuffix}@test.com`;
  const testCompany = `Mega Test Company ${randomSuffix}`;
  let token = '';
  
  let categoryId = '';
  let productId = '';
  let ingredientId = '';
  let tableId = '';
  let cashierId = '';
  let orderId = '';
  let customerId = '';
  
  try {
    // 1. Registro e Login
    console.log('\n[1] Autenticação');
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: testCompany, userName: 'Mega', email: testEmail, password: 'password123' })
    });
    
    // Eleva o plano para PRO para liberar rotas restritas
    await pool.query(`UPDATE companies SET plan = 'pro' WHERE name = $1`, [testCompany]);

    const loginReq = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginRes = await loginReq.json();
    token = loginRes.token;
    console.log('✅ Auth Passou!');

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 2. Ingredientes (Estoque)
    console.log('\n[2] Ingredientes');
    const ingReq = await fetch(`${baseUrl}/api/ingredients`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Carne Bovina', unit: 'kg', cost: 35.0, currentStock: 10, minimumStock: 2 })
    });
    const ingRes = await ingReq.json();
    ingredientId = ingRes.id;
    assert.strictEqual(ingReq.status, 201);
    console.log('✅ Ingredientes Passou!');

    // 3. Catálogo (Categoria e Produto)
    console.log('\n[3] Catálogo');
    const catReq = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST', headers, body: JSON.stringify({ name: 'Combos' })
    });
    categoryId = (await catReq.json()).id;
    const prodReq = await fetch(`${baseUrl}/api/products`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Mega Combo', categoryId, price: 45.0, cost: 20.0 })
    });
    productId = (await prodReq.json()).id;
    assert.strictEqual(prodReq.status, 201);
    console.log('✅ Catálogo Passou!');

    // 4. Mesas
    console.log('\n[4] Mesas');
    const tableReq = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST', headers,
      body: JSON.stringify({ number: 99, status: 'available' })
    });
    tableId = (await tableReq.json()).id;
    assert.strictEqual(tableReq.status, 201);
    console.log('✅ Mesas Passou!');

    // 5. Clientes
    console.log('\n[5] Clientes (Apenas GET)');
    const customerReq = await fetch(`${baseUrl}/api/customers`, {
      method: 'GET', headers
    });
    assert.strictEqual(customerReq.status, 200);
    console.log('✅ Clientes Passou!');

    // 6. Caixa
    console.log('\n[6] Caixa');
    const openReq = await fetch(`${baseUrl}/api/cashier/open`, {
      method: 'POST', headers,
      body: JSON.stringify({ openingBalance: 50.00 })
    });
    cashierId = (await openReq.json()).id;
    assert.strictEqual(openReq.status, 201);
    console.log('✅ Caixa Aberto Passou!');

    // 7. Pedidos (Mesa)
    console.log('\n[7] Pedidos');
    const orderReq = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST', headers,
      body: JSON.stringify({
        tableId,
        status: 'open',
        items: [{ productId, quantity: 1, price: 45.0 }]
      })
    });
    orderId = (await orderReq.json()).id;
    assert.strictEqual(orderReq.status, 201);
    console.log('✅ Pedidos Passou!');

    // 8. Vendas e Pagamentos (Fechando o pedido da mesa)
    // Para simplificar vamos apenas finalizar a venda via rota genérica, se houver
    console.log('\n[8] Vendas e Finalização');
    const saleReq = await fetch(`${baseUrl}/api/sales`, {
      method: 'POST', headers,
      body: JSON.stringify({
        orderId,
        cashRegisterId: cashierId,
        customerName: 'Mega Cliente',
        customerPhone: '119999999',
        totalAmount: 45.0,
        discount: 0,
        finalAmount: 45.0,
        status: 'completed',
        items: [{ productId, quantity: 1, price: 45.0 }],
        payments: [{ method: 'credit', amount: 45.0 }]
      })
    });
    assert.strictEqual(saleReq.status, 201);
    console.log('✅ Vendas e Pagamentos Passou!');

    // 9. Dashboard
    console.log('\n[9] Dashboard');
    const dashReq = await fetch(`${baseUrl}/api/dashboard/stats?period=today`, {
      method: 'GET', headers
    });
    assert.strictEqual(dashReq.status, 200);
    console.log('✅ Dashboard Passou!');
    
    console.log('\n🚀 TUDO PASSOU COM SUCESSO! VARREDURA TOTAL CONCLUÍDA!');

  } catch (error) {
    console.error('❌ ERRO DURANTE A VARREDURA:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n  -> Limpando banco de dados da Varredura Total...');
    try {
      await pool.query(`DELETE FROM companies WHERE name = $1`, [testCompany]);
    } catch (e) {
      console.error('Erro na limpeza:', e);
    }
    await pool.end();
    server.close();
  }
}

runMegaTests().then(() => console.log('=== Fim do Mega Teste ==='));
