import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';
import { MontantCotisation } from './montant-cotisation.entity';
import { MontantsCotisationController } from './montants-cotisation.controller';
import { MontantsCotisationService } from './montants-cotisation.service';

@Module({
  imports: [TypeOrmModule.forFeature([MontantCotisation, AnneeAcademique, AcademicLevel, User, InscriptionAnnuelle])],
  controllers: [MontantsCotisationController],
  providers: [MontantsCotisationService],
  exports: [MontantsCotisationService],
})
export class MontantsCotisationModule {}
