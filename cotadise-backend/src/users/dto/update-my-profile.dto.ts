import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  wavePhone?: string;
}
