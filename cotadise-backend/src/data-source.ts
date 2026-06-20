import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Cotisation } from './cotisations/cotisation.entity';
import { Paiement } from './paiements/paiement.entity';
import { Adherent } from './adherents/adherent.entity';
import { AcademicLevel } from './levels/academic-level.entity';
import { AnneeAcademique } from './annees-academiques/annee-academique.entity';
import { InscriptionAnnuelle } from './inscriptions-annuelles/inscription-annuelle.entity';
import { MontantCotisation } from './montants-cotisation/montant-cotisation.entity';
import { Notification } from './notifications/notification.entity';
import { EmailMessage } from './email-outbox/email-message.entity';
import { Defi } from './defis/defi.entity';
import { DonAlumni } from './dons/don-alumni.entity';
import { WaveMarchandConfiguration } from './configurations-wave/wave-marchand-configuration.entity';
import { AuditLog } from './audit/audit-log.entity';
import { CreateUsersTable1685620000000 } from './migrations/1685620000000-CreateUsersTable';
import { CreateCotisationsTable1685620100000 } from './migrations/1685620100000-CreateCotisationsTable';
import { CreatePaiementsTable1685620200000 } from './migrations/1685620200000-CreatePaiementsTable';
import { CreateAdherentsTable1685620300000 } from './migrations/1685620300000-CreateAdherentsTable';
import { CreateAcademicLevelsTable1685620400000 } from './migrations/1685620400000-CreateAcademicLevelsTable';
import { CreateAcademicYearBusinessTables1685620500000 } from './migrations/1685620500000-CreateAcademicYearBusinessTables';
import { CreateWaveMarchandConfigurations1685620600000 } from './migrations/1685620600000-CreateWaveMarchandConfigurations';
import { CreateAuditLogs1685620700000 } from './migrations/1685620700000-CreateAuditLogs';
import { AddPasswordResetFieldsToUsers1685620800000 } from './migrations/1685620800000-AddPasswordResetFieldsToUsers';
import { AddActivationCodeToUsers1685620900000 } from './migrations/1685620900000-AddActivationCodeToUsers';

config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? {
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: decodeURIComponent(process.env.DATABASE_PASSWORD || 'postgres'),
        database: process.env.DATABASE_NAME || 'cotadise',
      }),
  entities: [User, Cotisation, Paiement, Adherent, AcademicLevel, AnneeAcademique, InscriptionAnnuelle, MontantCotisation, Notification, EmailMessage, Defi, DonAlumni, WaveMarchandConfiguration, AuditLog],
  migrations: [CreateUsersTable1685620000000, CreateCotisationsTable1685620100000, CreatePaiementsTable1685620200000, CreateAdherentsTable1685620300000, CreateAcademicLevelsTable1685620400000, CreateAcademicYearBusinessTables1685620500000, CreateWaveMarchandConfigurations1685620600000, CreateAuditLogs1685620700000, AddPasswordResetFieldsToUsers1685620800000, AddActivationCodeToUsers1685620900000],
  migrationsTableName: 'migrations',
});
