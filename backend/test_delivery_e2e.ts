import axios from 'axios';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const API_URL = 'http://localhost:3000/api';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runTest() {
  console.log('🚀 Iniciando Teste de Ponta a Ponta: Delivery');
  
  try {
    // 1. Criar Restaurante
    console.log('\n1️⃣ Criando restaurante de teste...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      companyName: 'Lanchonete Teste E2E',
      userName: 'Admin Teste',
      email: `admin_e2e_${Date.now()}@teste.com`,
      password: 'password123',
      plan: 'pro'
    });
    const token = registerRes.data.token;
    const companyId = registerRes.data.user.companyId;
    console.log(`✅ Restaurante criado! ID: ${companyId}`);

    // Ativar o plano pro via banco para habilitar o delivery
    await pool.query(`UPDATE companies SET active = true, plan = 'pro' WHERE id = $1`, [companyId]);
    console.log(`✅ Restaurante ativado no plano PRO.`);

    // 2. Criar Categoria e Produto
    console.log('\n2️⃣ Cadastrando cardápio...');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    
    const catRes = await axios.post(`${API_URL}/categories`, { name: 'Lanches' }, authHeaders);
    const categoryId = catRes.data.id;
    
    const prodRes = await axios.post(`${API_URL}/products`, {
      name: 'X-Burger Especial',
      description: 'Pão, carne artesanal, queijo e salada.',
      price: 25.50,
      categoryId: categoryId,
      hasStock: false
    }, authHeaders);
    const productId = prodRes.data.id;
    console.log(`✅ Produto criado com sucesso: ${prodRes.data.name}`);

    // 3. Simular Cliente Acessando Delivery
    console.log('\n3️⃣ Cliente: Acessando menu do delivery...');
    const menuRes = await axios.get(`${API_URL}/public/menu/${companyId}`);
    const categories = menuRes.data.categories;
    const products = menuRes.data.products;
    console.log('Categories:', categories.length, 'Products:', products.length);
    if (products.length > 0 && products[0].id === productId) {
      console.log(`✅ Menu carregado com sucesso (X-Burger encontrado)!`);
    } else {
      throw new Error("Produto não apareceu no cardápio público.");
    }

    // 4. Cliente Fazendo Pedido
    console.log('\n4️⃣ Cliente: Realizando o pedido de Delivery...');
    const orderPayload = {
      type: 'delivery',
      customerName: 'Cliente Teste E2E',
      customerPhone: '11999999999',
      address: {
        street: 'Rua do Teste',
        number: '123',
        neighborhood: 'Bairro Teste',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        reference: 'Perto do parque'
      },
      paymentMethod: 'pix',
      items: [
        {
          productId: productId,
          quantity: 2,
          notes: 'Sem cebola'
        }
      ]
    };
    
    const orderRes = await axios.post(`${API_URL}/public/order/${companyId}`, orderPayload);
    const orderId = orderRes.data.id;
    console.log(`✅ Pedido realizado com sucesso! Tracking Code: ${orderRes.data.tracking_code}`);

    // 5. Verificar Painel do Restaurante (Admin)
    console.log('\n5️⃣ Restaurante: Verificando recebimento no painel...');
    const ordersRes = await axios.get(`${API_URL}/orders`, authHeaders);
    const orderExists = ordersRes.data.some((o: any) => o.id === orderId);
    if (orderExists) {
      console.log(`✅ Pedido ${orderId} recebido e visível no painel do administrador!`);
    } else {
      throw new Error("Pedido não apareceu no painel.");
    }

    console.log('\n🎉 Teste E2E do Delivery concluído com SUCESSO Absoluto!');

  } catch (error: any) {
    console.error('\n❌ ERRO NO TESTE:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    await pool.end();
  }
}

runTest();
