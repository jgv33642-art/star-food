import assert from 'assert';
import http from 'http';
import app from '../../src/app';
import { pool } from '../../src/config/db';

async function runMegaTestsPt2() {
  console.log('=== Início da Varredura Total (Mega Teste - Parte 2) ===');
  
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testEmail = `mega2_${randomSuffix}@test.com`;
  const testCompany = `Mega Test Pt2 ${randomSuffix}`;
  let token = '';
  let companyId = '';
  
  let courierId = '';
  let complementCategoryId = '';
  let complementOptionId = '';
  let staffId = '';
  
  try {
    // 1. Registro e Login
    console.log('\n[1] Autenticação e Preparação');
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: testCompany, userName: 'Mega', email: testEmail, password: 'password123' })
    });
    
    // Elevamos o plano para PRO para permitir testar rotas restritas (Configurações, Equipe, etc)
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
    console.log('✅ Preparação Concluída!');

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 2. Configurações da Loja
    console.log('\n[2] Configurações da Loja (Settings)');
    const settingsReq = await fetch(`${baseUrl}/api/settings/save`, {
      method: 'POST', headers,
      body: JSON.stringify({
        primary_color: '#FF0000',
        secondary_color: '#00FF00',
        store_name: 'Lanchonete Mega 2',
        is_open_manual: true,
        fee_type: 'fixed',
        max_delivery_radius_km: 10
      })
    });
    assert.strictEqual(settingsReq.status, 200, `Falha nas Configurações: ${settingsReq.status}`);
    console.log('✅ Configurações Passou!');

    // 3. Entregadores (Couriers)
    console.log('\n[3] Entregadores (Couriers)');
    const courierReq = await fetch(`${baseUrl}/api/couriers`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Motoboy Teste', phone: '11988888888', vehicle: 'Moto', active: true })
    });
    const courierRes = await courierReq.json();
    courierId = courierRes.id;
    assert.strictEqual(courierReq.status, 201, `Falha em Couriers: ${courierReq.status}`);
    console.log('✅ Entregadores Passou!');

    // 4. Gestão de Equipe (Users/Staff)
    console.log('\n[4] Gestão de Equipe (Usuários)');
    const staffReq = await fetch(`${baseUrl}/api/users/staff`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Operador de Caixa', role: 'cashier', pin: '1234' })
    });
    const staffRes = await staffReq.json();
    staffId = staffRes.id;
    assert.strictEqual(staffReq.status, 201, `Falha na Equipe: ${staffReq.status} - ${JSON.stringify(staffRes)}`);
    console.log('✅ Equipe Passou!');

    // 5. Complementos (Complements)
    console.log('\n[5] Complementos (Categorias e Opções)');
    const compCatReq = await fetch(`${baseUrl}/api/complements`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Ponto da Carne', isRequired: true, minOptions: 1, maxOptions: 1 })
    });
    const compCatRes = await compCatReq.json();
    complementCategoryId = compCatRes.id;
    assert.strictEqual(compCatReq.status, 201, `Falha em Categoria de Complemento: ${compCatReq.status}`);

    const compOptReq = await fetch(`${baseUrl}/api/complements/${complementCategoryId}/options`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Ao Ponto', price: 0.0 })
    });
    const compOptRes = await compOptReq.json();
    complementOptionId = compOptRes.id;
    assert.strictEqual(compOptReq.status, 201, `Falha em Opção de Complemento: ${compOptReq.status}`);
    console.log('✅ Complementos Passou!');

    // 6. Estoque (Histórico)
    console.log('\n[6] Estoque (Histórico)');
    const stockReq = await fetch(`${baseUrl}/api/stock/history`, {
      method: 'GET', headers
    });
    assert.strictEqual(stockReq.status, 200, `Falha no Estoque: ${stockReq.status}`);
    console.log('✅ Estoque Passou!');

    console.log('\n🚀 TUDO PASSOU COM SUCESSO! VARREDURA DA PARTE 2 CONCLUÍDA!');

  } catch (error) {
    console.error('❌ ERRO DURANTE A VARREDURA DA PARTE 2:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n  -> Limpando banco de dados da Parte 2...');
    try {
      await pool.query(`DELETE FROM store_settings WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM companies WHERE name = $1`, [testCompany]);
    } catch (e) {
      console.error('Erro na limpeza:', e);
    }
    await pool.end();
    server.close();
  }
}

runMegaTestsPt2().then(() => console.log('=== Fim do Mega Teste Parte 2 ==='));
