import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendPromotionMessageDto {
  @IsString()
  @MaxLength(150)
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  canal?: 'application' | 'email' | 'application_et_email';
}
