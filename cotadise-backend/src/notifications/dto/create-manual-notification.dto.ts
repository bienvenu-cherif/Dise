import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { CanalNotification, TypeNotification } from '../notification.entity';

export class CreateManualNotificationDto {
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @IsOptional()
  @IsUUID()
  anneeAcademiqueId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  promotionSortante?: string;

  @IsOptional()
  @IsIn(['message_manuel', 'demande_aide_alumni'])
  type?: TypeNotification;

  @IsOptional()
  @IsIn(['application', 'email', 'application_et_email'])
  canal?: CanalNotification;

  @IsNotEmpty()
  @IsString()
  @Length(2, 150)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 4000)
  message: string;
}
