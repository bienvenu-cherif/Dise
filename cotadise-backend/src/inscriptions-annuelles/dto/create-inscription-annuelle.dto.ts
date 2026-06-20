import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import type { StatutScolaire } from '../inscription-annuelle.entity';

export class CreateInscriptionAnnuelleDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  anneeAcademiqueId: string;

  @IsUUID()
  levelId: string;

  @IsOptional()
  @IsIn(['actif', 'redoublant', 'abandon', 'exclu', 'alumni'])
  statutScolaire?: StatutScolaire;

  @IsOptional()
  @IsBoolean()
  eligibleCotisation?: boolean;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
