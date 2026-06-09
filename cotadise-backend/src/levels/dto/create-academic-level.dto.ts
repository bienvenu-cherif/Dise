import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateAcademicLevelDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  annualAmount: number;
}
