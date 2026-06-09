import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LevelsService } from '../levels/levels.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly levelsService: LevelsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultLevels();

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

  private async seedDefaultLevels(): Promise<void> {
    const existingLevels = await this.levelsService.findAll();
    const existingNames = new Set(existingLevels.map((level) => level.name.toLowerCase()));
    const defaultLevels = [
      { name: 'ISE1', description: 'Premiere annee ISE', annualAmount: 0 },
      { name: 'ISE2', description: 'Deuxieme annee ISE', annualAmount: 0 },
      { name: 'ISE3', description: 'Troisieme annee ISE', annualAmount: 0 },
      { name: 'alumni', description: 'Anciens etudiants, non eligibles aux cotisations obligatoires', annualAmount: 0 },
    ];

    for (const level of defaultLevels) {
      if (!existingNames.has(level.name.toLowerCase())) {
        await this.levelsService.create(level);
        this.logger.log(`Default level created: ${level.name}`);
      }
    }
  }
}
