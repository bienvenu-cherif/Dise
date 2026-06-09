import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateAnnualCotisationsDto {
  @IsUUID()
  anneeAcademiqueId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
