import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('confirme que PostgreSQL repond', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      await expect(appController.health()).resolves.toEqual(
        expect.objectContaining({ status: 'ok', database: 'up' }),
      );
    });
  });
});
