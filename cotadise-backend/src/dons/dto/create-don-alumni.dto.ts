import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDonAlumniDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsUUID()
  alumniId?: string;

  @IsOptional()
  @IsUUID()
  recordedById?: string;

  @IsOptional()
  @IsIn(['initie', 'en_attente', 'confirme', 'echoue', 'annule'])
  status?: string;

  @IsOptional()
  @IsIn(['don_wave', 'don_main_a_main', 'ajustement_tresorier'])
  origin?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
