import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { Paiement } from './paiement.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { User } from '../users/user.entity';
import { DefisModule } from '../defis/defis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaveMarchandConfiguration } from '../configurations-wave/wave-marchand-configuration.entity';
import { WaveMarchandConfigurationsModule } from '../configurations-wave/wave-marchand-configurations.module';
import { AuditModule } from '../audit/audit.module';
import { WavePaiementsService } from './wave-paiements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Paiement, Cotisation, User, WaveMarchandConfiguration]), NotificationsModule, DefisModule, WaveMarchandConfigurationsModule, AuditModule],
  controllers: [PaiementsController],
  providers: [PaiementsService, WavePaiementsService],
})
export class PaiementsModule {}
