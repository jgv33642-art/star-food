import assert from 'assert';
import http from 'http';
import app from '../../src/app';
import { pool } from '../../src/config/db';

async function runMegaTestsPt3() {
  console.log('=== Início da Varredura Total (Mega Teste - Parte 3: Rotas Secundárias) ===');
  
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testEmail = `mega3_${randomSuffix}@test.com`;
  const testCompany = `Mega Test Pt3 ${randomSuffix}`;
  let token = '';
  let companyId = '';
  
  try {
    // 1. Registro e Login
    console.log('\n[1] Autenticação e Preparação');
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: testCompany, userName: 'Mega', email: testEmail, password: 'password123' })
    });
    
    const updateRes = await pool.query(`UPDATE companies SET plan = 'pro' WHERE name = $1 RETURNING id`, [testCompany]);
    companyId = updateRes.rows[0].id;

    const loginReq = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginRes = await loginReq.json();
    token = loginRes.token;
    assert.strictEqual(loginReq.status, 200);

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 2. Criar recursos básicos para edição/deleção
    console.log('\n[2] Criação de Recursos Base para Testes');
    
    const catReq = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST', headers, body: JSON.stringify({ name: 'Categoria A' })
    });
    const categoryId = (await catReq.json()).id;

    const prodReq = await fetch(`${baseUrl}/api/products`, {
      method: 'POST', headers,
      body: JSON.stringify({ categoryId, name: 'Produto Original', price: 10, cost: 5 })
    });
    const productId = (await prodReq.json()).id;

    const tableReq = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST', headers, body: JSON.stringify({ number: 99 })
    });
    const tableId = (await tableReq.json()).id;

    // 3. Testar PUT (Atualizações)
    console.log('\n[3] Testando PUT (Atualizações)');
    
    const putCatReq = await fetch(`${baseUrl}/api/categories/${categoryId}`, {
      method: 'PUT', headers, body: JSON.stringify({ name: 'Categoria Editada' })
    });
    assert.strictEqual(putCatReq.status, 200, `Falha em PUT Categoria: ${putCatReq.status}`);

    const putProdReq = await fetch(`${baseUrl}/api/products/${productId}`, {
      method: 'PUT', headers, body: JSON.stringify({ name: 'Produto Editado', price: 15 })
    });
    assert.strictEqual(putProdReq.status, 200, `Falha em PUT Produto: ${putProdReq.status}`);

    const putTableReq = await fetch(`${baseUrl}/api/tables/${tableId}`, {
      method: 'PUT', headers, body: JSON.stringify({ number: 100, status: 'occupied' })
    });
    assert.strictEqual(putTableReq.status, 200, `Falha em PUT Mesa: ${putTableReq.status}`);
    console.log('✅ Atualizações Passaram!');

    // 4. Testar Fluxo Avançado de Pedido (Adição de itens, Checkout)
    console.log('\n[4] Fluxo Avançado de Pedido (Checkout, Adição de Itens)');
    
    // Abre caixa
    const openReq = await fetch(`${baseUrl}/api/cashier/open`, {
      method: 'POST', headers, body: JSON.stringify({ openingBalance: 100 })
    });
    const cashierId = (await openReq.json()).id;

    // Cria pedido
    const orderReq = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST', headers,
      body: JSON.stringify({ tableId, status: 'open', items: [{ productId, quantity: 1, price: 15.0 }] })
    });
    const orderId = (await orderReq.json()).id;

    // Adiciona outro item
    const addItemReq = await fetch(`${baseUrl}/api/orders/${orderId}/items`, {
      method: 'POST', headers,
      body: JSON.stringify({ productId, quantity: 2, price: 15.0 })
    });
    assert.strictEqual(addItemReq.status, 201, `Falha em AddItem: ${addItemReq.status}`);

    // Pagamento Completo via Checkout unificado
    const payReq = await fetch(`${baseUrl}/api/orders/${orderId}/pay`, {
      method: 'POST', headers,
      body: JSON.stringify({
        cashRegisterId: cashierId,
        payments: [{ method: 'pix', amount: 45.0 }],
        customerName: 'Secundário',
        customerPhone: '11111'
      })
    });
    assert.strictEqual(payReq.status, 201, `Falha em Pay Order: ${payReq.status}`);
    
    // Fechar Caixa
    const closeReq = await fetch(`${baseUrl}/api/cashier/close`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: cashierId, closingBalance: 145 }) // 100 de abertura + 45 pix = 145
    });
    assert.strictEqual(closeReq.status, 200, `Falha em Fechar Caixa: ${closeReq.status}`);
    console.log('✅ Pedido Avançado e Caixa Passaram!');

    // 5. Testar Deleções (DELETE) - Deletando na ordem inversa
    console.log('\n[5] Testando DELETE');
    
    const delTableReq = await fetch(`${baseUrl}/api/tables/${tableId}`, { method: 'DELETE', headers });
    assert.strictEqual(delTableReq.status, 200, `Falha em DELETE Mesa: ${delTableReq.status}`);

    // Tentar deletar categoria que tem produto pode falhar por FK, então vamos deletar o produto primeiro
    const delProdReq = await fetch(`${baseUrl}/api/products/${productId}`, { method: 'DELETE', headers });
    assert.strictEqual(delProdReq.status, 200, `Falha em DELETE Produto: ${delProdReq.status}`);

    const delCatReq = await fetch(`${baseUrl}/api/categories/${categoryId}`, { method: 'DELETE', headers });
    assert.strictEqual(delCatReq.status, 200, `Falha em DELETE Categoria: ${delCatReq.status}`);
    console.log('✅ Deleções Passaram!');

    // 6. Relatórios
    console.log('\n[6] Relatórios (Reports)');
    const reportReq = await fetch(`${baseUrl}/api/reports/top-products`, { method: 'GET', headers });
    assert.strictEqual(reportReq.status, 200, `Falha em Top Products: ${reportReq.status}`);
    
    const cmvReq = await fetch(`${baseUrl}/api/reports/cmv`, { method: 'GET', headers });
    assert.strictEqual(cmvReq.status, 200, `Falha em CMV: ${cmvReq.status}`);
    console.log('✅ Relatórios Passaram!');

    console.log('\n🚀 TUDO PASSOU COM SUCESSO! VARREDURA DA PARTE 3 CONCLUÍDA!');

  } catch (error) {
    console.error('❌ ERRO DURANTE A VARREDURA DA PARTE 3:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n  -> Limpando banco de dados da Parte 3...');
    try {
      await pool.query(`DELETE FROM companies WHERE name = $1`, [testCompany]);
    } catch (e) {
      console.error('Erro na limpeza:', e);
    }
    await pool.end();
    server.close();
  }
}

runMegaTestsPt3().then(() => console.log('=== Fim do Mega Teste Parte 3 ==='));
