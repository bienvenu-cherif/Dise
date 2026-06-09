import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { CreateAnneeAcademiqueDto } from './create-annee-academique.dto';
import { StatutAnneeAcademique } from '../annee-academique.entity';

export class UpdateAnneeAcademiqueDto extends PartialType(CreateAnneeAcademiqueDto) {
  @IsOptional()
  @IsIn(['brouillon', 'ouverte', 'fermee'])
  statut?: StatutAnneeAcademique;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
