import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Cotisation } from './cotisations/cotisation.entity';
import { Paiement } from './paiements/paiement.entity';
import { Adherent } from './adherents/adherent.entity';
import { AcademicLevel } from './levels/academic-level.entity';
import { CreateUsersTable1685620000000 } from './migrations/1685620000000-CreateUsersTable';
import { CreateCotisationsTable1685620100000 } from './migrations/1685620100000-CreateCotisationsTable';
import { CreatePaiementsTable1685620200000 } from './migrations/1685620200000-CreatePaiementsTable';
import { CreateAdherentsTable1685620300000 } from './migrations/1685620300000-CreateAdherentsTable';
import { CreateAcademicLevelsTable1685620400000 } from './migrations/1685620400000-CreateAcademicLevelsTable';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: decodeURIComponent(process.env.DATABASE_PASSWORD || 'postgres'),
  database: process.env.DATABASE_NAME || 'cotadise',
  entities: [User, Cotisation, Paiement, Adherent, AcademicLevel],
  migrations: [CreateUsersTable1685620000000, CreateCotisationsTable1685620100000, CreatePaiementsTable1685620200000, CreateAdherentsTable1685620300000, CreateAcademicLevelsTable1685620400000],
  migrationsTableName: 'migrations',
});
