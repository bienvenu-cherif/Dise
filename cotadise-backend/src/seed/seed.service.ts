import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@cotadise.local');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'Admin123!');

    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    if (existingAdmin) {
      this.logger.log(`Admin user already exists: ${adminEmail}`);
      return;
    }

    this.logger.log(`Creating initial admin user: ${adminEmail}`);
    await this.usersService.create(
      {
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: adminPassword,
      },
      'admin',
    );
    this.logger.log('Initial admin user created successfully');
  }
}
