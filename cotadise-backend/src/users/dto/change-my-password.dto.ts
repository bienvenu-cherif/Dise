import { Matches, IsString, Length } from 'class-validator';

export class ChangeMyPasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(8, 80)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le nouveau mot de passe doit contenir au moins une lettre et un chiffre',
  })
  newPassword: string;
}
