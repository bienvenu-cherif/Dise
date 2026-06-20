import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaiementDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsNotEmpty()
  @IsUUID()
  cotisationId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  payerId?: string;

  @IsOptional()
  @IsUUID()
  recordedById?: string;

  @IsOptional()
  @IsUUID()
  waveConfigurationId?: string;

  @IsOptional()
  @IsIn(['initie', 'en_attente', 'confirme', 'echoue', 'annule'])
  status?: string;

  @IsOptional()
  @IsIn(['paiement_personnel', 'paiement_pour_camarade', 'main_a_main', 'ajustement_tresorier'])
  origin?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
