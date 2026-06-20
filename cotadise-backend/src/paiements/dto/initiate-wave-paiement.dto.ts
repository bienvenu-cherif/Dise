import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class InitiateWavePaiementDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsUUID()
  cotisationId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
