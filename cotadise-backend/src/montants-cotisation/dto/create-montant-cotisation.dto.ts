import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TypeMontantCotisation } from '../montant-cotisation.entity';

export class CreateMontantCotisationDto {
  @IsUUID()
  anneeAcademiqueId: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsIn(['niveau', 'exception'])
  type: TypeMontantCotisation;

  @IsNumber()
  @Min(0)
  montant: number;

  @IsDateString()
  dateLimite: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
