import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth e2e', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ identifier: process.env.ADMIN_EMAIL || 'admin@cotadise.local', password: process.env.ADMIN_PASSWORD || 'Admin123!' })
      .expect(201);

    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and authenticate a new user', async () => {
    const email = `user+${Date.now()}@cotadise.local`;
    const password = 'Password123!';

    const createResponse = await request(server)
      .post('/users')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email,
        password,
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.email).toBe(email);
    expect(createResponse.body).not.toHaveProperty('passwordHash');

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ identifier: email, password })
      .expect(201);

    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body.user.email).toBe(email);
  });

  it('should reject access to /users for a regular user', async () => {
    const email = `user+${Date.now()}@cotadise.local`;
    const password = 'Password123!';

    await request(server).post('/users').send({
      firstName: 'Test',
      lastName: 'User',
      email,
      password,
    }).expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ identifier: email, password })
      .expect(201);

    await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(403);
  });

  it('should allow admin to list users', async () => {
    const response = await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
