import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Adherents e2e', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let adherentId: string;

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
    const email = `adherent+${Date.now()}@cotadise.local`;
    const password = 'Password123!';

    const createResponse = await request(server)
      .post('/users')
      .send({
        firstName: 'Adherent',
        lastName: 'Test',
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

  it('should allow admin to create an adherent', async () => {
    const response = await request(server)
      .post('/adherents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        membershipNumber: `M-${Date.now()}`,
        userId,
        address: '123 Rue des Tests',
        birthDate: '1990-01-01',
        status: 'active',
      })
      .expect(201);

    adherentId = response.body.id;
    expect(response.body.membershipNumber).toMatch(/^M-/);
    expect(response.body.user.id).toBe(userId);
  });

  it('should allow user to retrieve their own adherent record', async () => {
    const response = await request(server)
      .get('/adherents/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.user.id).toBe(userId);
  });

  it('should allow admin to list adherents and fetch by id', async () => {
    const listResponse = await request(server)
      .get('/adherents')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.some((item: any) => item.id === adherentId)).toBe(true);

    const getResponse = await request(server)
      .get(`/adherents/${adherentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(getResponse.body.id).toBe(adherentId);
  });

  it('should export adherents as an Excel file for admin', async () => {
    const response = await request(server)
      .get('/adherents/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain('attachment; filename="adherents.xlsx"');
    expect(response.body).toBeDefined();
  });

  it('should export active adherents as an Excel file for admin', async () => {
    const response = await request(server)
      .get('/adherents/export?status=active')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(response.headers['content-disposition']).toContain('attachment; filename="adherents-active.xlsx"');
    expect(response.body).toBeDefined();
  });
});
