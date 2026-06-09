import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePaiementDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsNotEmpty()
  @IsUUID()
  cotisationId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
