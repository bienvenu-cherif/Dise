import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Cotisation } from '../cotisations/cotisation.entity';
import { Paiement } from '../paiements/paiement.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Cotisation, Paiement, AcademicLevel])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
