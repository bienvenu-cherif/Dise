import { IsUUID } from 'class-validator';

export class AppliquerPassagesDto {
  @IsUUID()
  anneeSourceId: string;

  @IsUUID()
  anneeCibleId: string;
}
