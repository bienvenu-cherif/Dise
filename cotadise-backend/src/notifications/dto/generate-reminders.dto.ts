import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class GenerateRemindersDto {
  @IsUUID()
  anneeAcademiqueId: string;

  @IsOptional()
  @IsInt()
  @Min(7)
  inactiveDays?: number;
}
