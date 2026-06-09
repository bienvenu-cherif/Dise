import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Levels and Dashboard e2e', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let levelId: string;
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

  it('should allow admin to create an academic level', async () => {
    const levelName = `Licence 1 ${Date.now()}`;
    const response = await request(server)
      .post('/levels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: levelName,
        description: 'Montant pour les étudiants de L1',
        annualAmount: 100,
      })
      .expect(201);

    levelId = response.body.id;
    expect(response.body.name).toBe(levelName);
    expect(response.body.annualAmount).toBe(100);
  });

  it('should allow admin to create a user attached to the level', async () => {
    const email = `student+${Date.now()}@cotadise.local`;
    const password = 'Student123!';

    const createResponse = await request(server)
      .post('/users')
      .send({
        firstName: 'Student',
        lastName: 'One',
        email,
        password,
        levelId,
      })
      .expect(201);

    userId = createResponse.body.id;
    expect(createResponse.body.level).toBeDefined();
    expect(createResponse.body.level.id).toBe(levelId);

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ identifier: email, password })
      .expect(201);

    userToken = loginResponse.body.accessToken;
    expect(userToken).toBeDefined();
  });

  it('should allow admin to create an overdue cotisation for the student', async () => {
    const response = await request(server)
      .post('/cotisations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Cotisation en retard',
        description: 'Cotisation passée',
        amount: 50,
        dueDate: '2024-01-01',
        userId,
      })
      .expect(201);

    expect(response.body.amount).toBe(50);
    expect(response.body.status).toBe('pending');
  });

  it('should allow admin to generate cotisations for the academic level', async () => {
    const response = await request(server)
      .post(`/levels/${levelId}/generate-cotisations`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dueDate: '2026-12-31',
        title: 'Cotisation annuelle L1',
      })
      .expect(201);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        title: 'Cotisation annuelle L1',
        amount: 100,
        status: 'pending',
      }),
    );
  });

  it('should allow admin to create a cotisation for the student', async () => {
    const response = await request(server)
      .post('/cotisations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Cotisation L1',
        description: 'Cotisation niveau Licence 1',
        amount: 100,
        dueDate: '2026-12-31',
        userId,
      })
      .expect(201);

    cotisationId = response.body.id;
    expect(response.body.user.id).toBe(userId);
    expect(response.body.amount).toBe(100);
  });

  it('should allow the student to pay their own cotisation', async () => {
    const response = await request(server)
      .post('/paiements')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 40,
        method: 'mobile-money',
        reference: 'STUDENT-PAY-01',
        cotisationId,
      })
      .expect(201);

    expect(response.body.amount).toBe(40);
    expect(response.body.user.id).toBe(userId);
  });

  it('should return a student dashboard summary with progress based on the academic level amount', async () => {
    const response = await request(server)
      .get('/dashboard/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.progress).toBe(40);
    expect(response.body.level).toBeDefined();
    expect(response.body.level.id).toBe(levelId);
    expect(response.body.payments).toBeInstanceOf(Array);
    expect(response.body.cotisations).toBeInstanceOf(Array);
  });

  it('should return the student ranking within their academic level', async () => {
    const response = await request(server)
      .get('/dashboard/rankings/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.rank).toBe(1);
    expect(response.body.totalInLevel).toBe(1);
    expect(response.body.level).toBeDefined();
    expect(response.body.level.id).toBe(levelId);
    expect(response.body.rankings).toBeInstanceOf(Array);
    expect(response.body.rankings[0].userId).toBe(userId);
  });

  it('should return overdue cotisations for admin', async () => {
    const response = await request(server)
      .get('/dashboard/overdue')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.some((item) => item.title === 'Cotisation en retard')).toBe(true);
  });

  it('should return overdue cotisations filtered by level', async () => {
    const response = await request(server)
      .get(`/dashboard/overdue/level/${levelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.every((item) => item.level?.id === levelId)).toBe(true);
  });

  it('should export overdue cotisations as an Excel file for admin', async () => {
    const response = await request(server)
      .get('/dashboard/overdue/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain('attachment; filename="overdue-cotisations.xlsx"');
    expect(response.body).toBeDefined();
  });

  it('should export overdue cotisations by level as an Excel file for admin', async () => {
    const response = await request(server)
      .get(`/dashboard/overdue/level/${levelId}/export`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain(`attachment; filename="overdue-cotisations-${levelId}.xlsx"`);
    expect(response.body).toBeDefined();
  });

  it('should return academic level summaries for admin', async () => {
    const response = await request(server)
      .get('/dashboard/levels')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        levelId: expect.any(String),
        name: expect.any(String),
        annualAmount: expect.any(Number),
        studentsCount: expect.any(Number),
        paidAmount: expect.any(Number),
        expectedAmount: expect.any(Number),
        overdueCount: expect.any(Number),
        overdueAmount: expect.any(Number),
        progress: expect.any(Number),
      }),
    );
  });

  it('should return the specific academic level summary', async () => {
    const response = await request(server)
      .get(`/dashboard/levels/${levelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.levelId).toBe(levelId);
    expect(response.body.name).toBeDefined();
    expect(response.body.studentsCount).toBeGreaterThanOrEqual(1);
    expect(response.body.expectedAmount).toBeGreaterThanOrEqual(100);
    expect(response.body.overdueCount).toBeGreaterThanOrEqual(0);
    expect(response.body.overdueAmount).toBeGreaterThanOrEqual(0);
  });
});
