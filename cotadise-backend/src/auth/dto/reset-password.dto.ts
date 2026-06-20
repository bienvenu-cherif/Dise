import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 12)
  code: string;

  @IsString()
  @Length(8, 80)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le nouveau mot de passe doit contenir au moins une lettre et un chiffre',
  })
  newPassword: string;
}
