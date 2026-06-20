import { IsOptional, IsString } from 'class-validator';

export class WaveWebhookDto {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  amount?: number;

  @IsOptional()
  raw?: Record<string, unknown>;
}
