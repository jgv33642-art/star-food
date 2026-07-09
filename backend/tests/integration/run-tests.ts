import assert from 'assert';
import http from 'http';
import app from '../../src/app';
import { pool } from '../../src/config/db';

async function runTests() {
  console.log('--- Início dos Testes End-to-End ---');
  
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testEmail = `owner_${randomSuffix}@test.com`;
  const testCompany = `Test Company ${randomSuffix}`;
  let token = '';
  let categoryId = '';
  let productId = '';
  
  try {
    // ==========================================
    // PARTE 1: ASSINATURA E LOGIN
    // ==========================================
    console.log('\n[TESTE 1] - Subscription Flow');
    console.log('  -> Executando registro...');
    const regReq = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: testCompany,
        userName: 'Test Owner',
        email: testEmail,
        password: 'password123'
      })
    });
    const regRes = await regReq.json();
    assert.strictEqual(regReq.status, 201, `Status no registro falhou: ${regReq.status}`);
    
    console.log('  -> Executando login...');
    const loginReq = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginRes = await loginReq.json();
    assert.strictEqual(loginReq.status, 200, `Status no login falhou: ${loginReq.status}`);
    token = loginRes.token;
    console.log('✅ Subscription Flow - PASSOU!');

    // ==========================================
    // PARTE 2: CATÁLOGO (Categorias e Produtos)
    // ==========================================
    console.log('\n[TESTE 2] - Catalog Flow (Category & Product)');
    console.log('  -> Criando categoria...');
    const catReq = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Lanches' })
    });
    const catRes = await catReq.json();
    assert.strictEqual(catReq.status, 201, `Criar categoria falhou: ${catReq.status}`);
    assert.ok(catRes.id, 'Categoria não retornou ID');
    categoryId = catRes.id;
    console.log('  -> Categoria criada:', catRes.name);

    console.log('  -> Criando produto...');
    const prodReq = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: 'X-Bacon Teste',
        categoryId: categoryId,
        description: 'Pão, carne, queijo e muito bacon',
        price: 25.50,
        cost: 10.00
      })
    });
    const prodRes = await prodReq.json();
    assert.strictEqual(prodReq.status, 201, `Criar produto falhou: ${prodReq.status}`);
    assert.ok(prodRes.id, 'Produto não retornou ID');
    productId = prodRes.id;
    console.log('  -> Produto criado:', prodRes.name);
    console.log('✅ Catalog Flow - PASSOU!');

    // ==========================================
    // PARTE 3: OPERAÇÕES (Caixa)
    // ==========================================
    console.log('\n[TESTE 3] - Operations Flow (Cashier)');
    console.log('  -> Abrindo caixa...');
    const openReq = await fetch(`${baseUrl}/api/cashier/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ openingBalance: 100.50 })
    });
    const openRes = await openReq.json();
    assert.strictEqual(openReq.status, 201, `Abrir caixa falhou: ${openReq.status}`);
    assert.strictEqual(openRes.status, 'open', 'Status do caixa deve ser open');
    console.log('  -> Caixa aberto com sucesso, ID:', openRes.id);

    console.log('  -> Fechando caixa...');
    const closeReq = await fetch(`${baseUrl}/api/cashier/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: openRes.id, closingBalance: 250.00 })
    });
    const closeRes = await closeReq.json();
    assert.strictEqual(closeReq.status, 200, `Fechar caixa falhou: ${closeReq.status}`);
    assert.strictEqual(closeRes.status, 'closed', 'Status do caixa deve ser closed');
    console.log('  -> Caixa fechado com sucesso.');
    console.log('✅ Operations Flow - PASSOU!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n  -> Limpando banco de dados (Teardown)...');
    try {
      if (productId) await pool.query(`DELETE FROM products WHERE id = $1`, [productId]);
      if (categoryId) await pool.query(`DELETE FROM categories WHERE id = $1`, [categoryId]);
      await pool.query(`DELETE FROM cash_registers WHERE company_id = (SELECT id FROM companies WHERE name = $1)`, [testCompany]);
      await pool.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
      await pool.query(`DELETE FROM companies WHERE name = $1`, [testCompany]);
    } catch (e) {
      console.error('Erro na limpeza:', e);
    }
    await pool.end();
    server.close();
  }
}

runTests().then(() => console.log('--- Fim dos Testes ---'));
