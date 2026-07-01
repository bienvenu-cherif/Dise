import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendTestEmailDto {
  @IsNotEmpty()
  @IsEmail()
  recipientEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;
}
