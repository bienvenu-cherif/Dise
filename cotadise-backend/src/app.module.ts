import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CotisationsModule } from './cotisations/cotisations.module';
import { PaiementsModule } from './paiements/paiements.module';
import { AdherentsModule } from './adherents/adherents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LevelsModule } from './levels/levels.module';
import { SeedService } from './seed/seed.service';
import { User } from './users/user.entity';
import { Cotisation } from './cotisations/cotisation.entity';
import { Paiement } from './paiements/paiement.entity';
import { Adherent } from './adherents/adherent.entity';
import { AcademicLevel } from './levels/academic-level.entity';
import { CreateUsersTable1685620000000 } from './migrations/1685620000000-CreateUsersTable';
import { CreateCotisationsTable1685620100000 } from './migrations/1685620100000-CreateCotisationsTable';
import { CreatePaiementsTable1685620200000 } from './migrations/1685620200000-CreatePaiementsTable';
import { CreateAdherentsTable1685620300000 } from './migrations/1685620300000-CreateAdherentsTable';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DATABASE_PORT', '5432'), 10),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: decodeURIComponent(
          configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        ),
        database: configService.get<string>('DATABASE_NAME', 'cotadise'),
        entities: [User, Cotisation, Paiement, Adherent, AcademicLevel],
        migrations: [CreateUsersTable1685620000000, CreateCotisationsTable1685620100000, CreatePaiementsTable1685620200000, CreateAdherentsTable1685620300000],
        migrationsRun: configService.get<string>('NODE_ENV') === 'production',
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    LevelsModule,
    CotisationsModule,
    PaiementsModule,
    AdherentsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
