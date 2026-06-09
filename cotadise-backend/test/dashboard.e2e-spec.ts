import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Dashboard e2e', () => {
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

  it('should return dashboard summary for admin', async () => {
    const response = await request(server)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      totalCotisations: expect.any(Number),
      totalAmount: expect.any(Number),
      totalPaidAmount: expect.any(Number),
      totalRemainingAmount: expect.any(Number),
      totalPaid: expect.any(Number),
      totalPartial: expect.any(Number),
      totalPending: expect.any(Number),
      totalPayments: expect.any(Number),
      totalPaymentAmount: expect.any(Number),
    });
  });
});
