import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';
import { Defi } from './defi.entity';
import { DefisController } from './defis.controller';
import { DefisService } from './defis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Defi, User, AnneeAcademique, Cotisation]), NotificationsModule],
  controllers: [DefisController],
  providers: [DefisService],
  exports: [DefisService],
})
export class DefisModule {}
