import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './../src/app.module';

describe('Users Excel Import e2e', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let levelName: string;
  const fixturePath = path.join(__dirname, 'import-students.xlsx');

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

    levelName = `Licence ${Date.now()}`;
    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet([
      { firstName: 'Import', lastName: 'Student', email: `import.student+${Date.now()}@cotadise.local`, levelName },
    ]);
    xlsx.utils.book_append_sheet(workbook, sheet, 'Sheet1');
    xlsx.writeFile(workbook, fixturePath);
  });

  afterAll(async () => {
    if (fs.existsSync(fixturePath)) {
      fs.unlinkSync(fixturePath);
    }
    await app.close();
  });

  it('should import students from Excel file', async () => {
    await request(server)
      .post('/levels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: levelName, annualAmount: 100 })
      .expect(201);

    const response = await request(server)
      .post('/users/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', fixturePath)
      .expect(201);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toMatchObject({ status: 'created' });
  });
});
