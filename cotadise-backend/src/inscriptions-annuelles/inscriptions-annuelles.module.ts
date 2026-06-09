import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';
import { InscriptionAnnuelle } from './inscription-annuelle.entity';
import { InscriptionsAnnuellesController } from './inscriptions-annuelles.controller';
import { InscriptionsAnnuellesService } from './inscriptions-annuelles.service';

@Module({
  imports: [TypeOrmModule.forFeature([InscriptionAnnuelle, User, AnneeAcademique, AcademicLevel])],
  controllers: [InscriptionsAnnuellesController],
  providers: [InscriptionsAnnuellesService],
  exports: [InscriptionsAnnuellesService],
})
export class InscriptionsAnnuellesModule {}
