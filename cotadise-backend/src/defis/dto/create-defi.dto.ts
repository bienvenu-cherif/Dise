import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDefiDto {
  @IsUUID()
  opponentId: string;

  @IsOptional()
  @IsUUID()
  anneeAcademiqueId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}
