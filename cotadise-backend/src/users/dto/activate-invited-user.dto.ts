import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class ActivateInvitedUserDto {
  @IsOptional()
  @IsString()
  @Length(12, 12)
  activationCode?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  phone: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  wavePhone?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
