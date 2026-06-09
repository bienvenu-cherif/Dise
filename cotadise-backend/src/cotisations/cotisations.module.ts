import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotisationsController } from './cotisations.controller';
import { CotisationsService } from './cotisations.service';
import { Cotisation } from './cotisation.entity';
import { User } from '../users/user.entity';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { MontantCotisation } from '../montants-cotisation/montant-cotisation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cotisation, User, AnneeAcademique, InscriptionAnnuelle, MontantCotisation])],
  controllers: [CotisationsController],
  providers: [CotisationsService],
})
export class CotisationsModule {}
