import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GenerateAcademicLevelCotisationsDto {
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
