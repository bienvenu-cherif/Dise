import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Cotisations & Paiements e2e', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let cotisationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({
        identifier: process.env.ADMIN_EMAIL || 'admin@cotadise.local',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
      })
      .expect(201);

    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a regular user and authenticate them', async () => {
    const email = `user+${Date.now()}@cotadise.local`;
    const password = 'Password123!';

    const createResponse = await request(server)
      .post('/users')
      .send({
        firstName: 'Test',
        lastName: 'Paiement',
        email,
        password,
      })
      .expect(201);

    userId = createResponse.body.id;
    expect(userId).toBeDefined();

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ identifier: email, password })
      .expect(201);

    userToken = loginResponse.body.accessToken;
    expect(userToken).toBeDefined();
  });

  it('should allow admin to create a cotisation for the user', async () => {
    const response = await request(server)
      .post('/cotisations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Cotisation annuelle',
        description: 'Cotisation pour l’année 2026',
        amount: 120.5,
        dueDate: '2026-12-31',
        userId,
      })
      .expect(201);

    cotisationId = response.body.id;
    expect(response.body.title).toBe('Cotisation annuelle');
    expect(response.body.user.id).toBe(userId);
  });

  it('should allow the user to read their own cotisations', async () => {
    const response = await request(server)
      .get('/cotisations/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((item: any) => item.id === cotisationId)).toBe(true);
  });

  it('should allow admin to create a paiement and mark the cotisation as paid', async () => {
    const response = await request(server)
      .post('/paiements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 120.5,
        method: 'card',
        reference: 'PAY-123',
        cotisationId,
        userId,
      })
      .expect(201);

    expect(response.body.amount).toBe(120.5);
    expect(response.body.cotisation.id).toBe(cotisationId);
    expect(response.body.user.id).toBe(userId);
  });

  it('should allow the user to see their payments', async () => {
    const response = await request(server)
      .get('/paiements/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('amount');
  });

  it('should allow admin to export all payments as an Excel file', async () => {
    const response = await request(server)
      .get('/paiements/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain('attachment; filename="paiements.xlsx"');
  });

  it('should allow the user to export their own payments as an Excel file', async () => {
    const response = await request(server)
      .get('/paiements/me/export')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain(`attachment; filename="paiements-${userId}.xlsx"`);
  });

  it('should allow admin to export all cotisations as an Excel file', async () => {
    const response = await request(server)
      .get('/cotisations/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain('attachment; filename="cotisations.xlsx"');
  });

  it('should allow the user to export their own cotisations as an Excel file', async () => {
    const response = await request(server)
      .get('/cotisations/me/export')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain(`attachment; filename="cotisations-${userId}.xlsx"`);
  });
});
