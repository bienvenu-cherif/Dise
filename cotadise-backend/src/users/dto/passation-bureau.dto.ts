import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PassationBureauDto {
  @IsUUID()
  nouveauTresorierId: string;

  @IsOptional()
  @IsString()
  motif?: string;
}
