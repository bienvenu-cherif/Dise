import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';

export class CreateWaveMarchandConfigurationDto {
  @IsNotEmpty()
  @IsUUID()
  anneeAcademiqueId: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 150)
  nomCompte: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  nomBureau?: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  checkoutUrl: string;

  @IsOptional()
  @IsString()
  @Length(3, 10)
  currency?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  errorUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
