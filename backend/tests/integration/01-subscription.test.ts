import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/config/db';

const randomSuffix = Math.floor(Math.random() * 1000000);
const testEmail = `owner_${randomSuffix}@test.com`;
const testCompany = `Test Company ${randomSuffix}`;

jest.setTimeout(30000); // 30 segundos para evitar erro de timeout na nuvem

describe('01 - Subscription Flow', () => {
  afterAll(async () => {
    // Cleanup everything related to the test company and users
    await pool.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
    await pool.query(`DELETE FROM categories WHERE company_id = (SELECT id FROM companies WHERE name = $1)`, [testCompany]);
    await pool.query(`DELETE FROM companies WHERE name = $1`, [testCompany]);
    await pool.end();
  });

  it('should register a new company and owner user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      companyName: testCompany,
      userName: 'Test Owner',
      email: testEmail,
      password: 'password123'
    });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('admin');
  });

  it('should login with the created user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'password123'
    });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testEmail);
  });
});
