import { IsDateString, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAnneeAcademiqueDto {
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  libelle: string;

  @IsNotEmpty()
  @IsDateString()
  dateDebut: string;

  @IsNotEmpty()
  @IsDateString()
  dateFin: string;
}
