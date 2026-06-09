import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, MinLength, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsIn(['etudiant', 'admin', 'tresorier', 'alumni'])
  role?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
