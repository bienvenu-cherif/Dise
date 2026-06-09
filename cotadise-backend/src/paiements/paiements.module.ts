import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { Paiement } from './paiement.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { User } from '../users/user.entity';
import { DefisModule } from '../defis/defis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Paiement, Cotisation, User]), NotificationsModule, DefisModule],
  controllers: [PaiementsController],
  providers: [PaiementsService],
})
export class PaiementsModule {}
