import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @IsIn(['etudiant', 'admin', 'tresorier', 'alumni'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['invite', 'profil_a_completer', 'actif', 'suspendu'])
  accountStatus?: string;

  @IsOptional()
  @IsString()
  @IsIn(['import_officiel', 'passage_automatique', 'creation_manuelle'])
  entrySource?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  wavePhone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  promotionSortante?: string;
}
