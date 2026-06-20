import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from './annee-academique.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { MontantCotisation } from '../montants-cotisation/montant-cotisation.entity';
import { WaveMarchandConfiguration } from '../configurations-wave/wave-marchand-configuration.entity';
import { AnneesAcademiquesController } from './annees-academiques.controller';
import { AnneesAcademiquesService } from './annees-academiques.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnneeAcademique, InscriptionAnnuelle, MontantCotisation, Cotisation, WaveMarchandConfiguration])],
  controllers: [AnneesAcademiquesController],
  providers: [AnneesAcademiquesService],
  exports: [AnneesAcademiquesService],
})
export class AnneesAcademiquesModule {}
