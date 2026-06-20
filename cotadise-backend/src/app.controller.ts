import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    const startedAt = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        service: 'cotadise-backend',
        database: 'up',
        databaseLatencyMs: Date.now() - startedAt,
        uptimeSeconds: Math.round(process.uptime()),
        environment: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        service: 'cotadise-backend',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
