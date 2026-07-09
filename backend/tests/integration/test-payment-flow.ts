import assert from 'assert';
import http from 'http';
import app from '../../src/app';
import { pool } from '../../src/config/db';
import { env } from '../../src/config/env';

async function testPaymentFlow() {
  console.log('=== Iniciando Teste de Assinatura (Mercado Pago) ===');
  
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;
  
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testEmail = `assinatura_${randomSuffix}@test.com`;
  const testCompany = `Lanchonete Teste Assinatura ${randomSuffix}`;
  let token = '';
  
  try {
    // 1. Registro e Login
    console.log(`\n[1] Registrando nova empresa: ${testCompany}`);
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: testCompany, userName: 'Dono da Lanchonete', email: testEmail, password: 'password123' })
    });

    const loginReq = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginRes = await loginReq.json();
    token = loginRes.token;
    assert.strictEqual(loginReq.status, 200);

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 2. Simulando clique no botão "Assinar Plano PRO"
    console.log('\n[2] Simulando clique no botão "Assinar Plano PRO" -> Solicitando Link do Mercado Pago...');
    
    const checkoutReq = await fetch(`${baseUrl}/api/payments/checkout`, {
      method: 'POST', 
      headers, 
      body: JSON.stringify({ plan: 'pro' })
    });
    
    if (checkoutReq.status === 200) {
      const checkoutRes = await checkoutReq.json();
      console.log('✅ SUCESSO! O Mercado Pago autorizou a criação da preferência de pagamento e retornou o Link de Checkout Oficial:');
      console.log('\n-------------------------------------------------------------');
      console.log(`🔗 LINK DE PAGAMENTO: ${checkoutRes.initPoint}`);
      console.log('-------------------------------------------------------------\n');
      console.log('(O frontend redirecionaria o cliente para essa tela segura do Mercado Pago)');
    } else {
      const errorText = await checkoutReq.text();
      console.error(`❌ FALHA! Status HTTP: ${checkoutReq.status}. Erro: ${errorText}`);
      assert.fail('Erro na integração com Mercado Pago');
    }

    console.log('\n🚀 TESTE DE PAGAMENTO CONCLUÍDO!');

  } catch (error) {
    console.error('❌ ERRO:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n  -> Limpando banco de dados de teste...');
    try {
      await pool.query(`DELETE FROM companies WHERE name = $1`, [testCompany]);
    } catch (e) {
      console.error('Erro na limpeza:', e);
    }
    await pool.end();
    server.close();
  }
}

testPaymentFlow().then(() => console.log('=== Fim do Teste ==='));
