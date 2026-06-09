import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { EmailOutboxModule } from '../email-outbox/email-outbox.module';
import { Paiement } from '../paiements/paiement.entity';
import { User } from '../users/user.entity';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, AnneeAcademique, Cotisation, Paiement]), EmailOutboxModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
