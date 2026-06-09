import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from './annee-academique.entity';
import { AnneesAcademiquesController } from './annees-academiques.controller';
import { AnneesAcademiquesService } from './annees-academiques.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnneeAcademique])],
  controllers: [AnneesAcademiquesController],
  providers: [AnneesAcademiquesService],
  exports: [AnneesAcademiquesService],
})
export class AnneesAcademiquesModule {}
