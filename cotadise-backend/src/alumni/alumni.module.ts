import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';
import { AlumniController } from './alumni.controller';
import { AlumniService } from './alumni.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), NotificationsModule],
  controllers: [AlumniController],
  providers: [AlumniService],
})
export class AlumniModule {}
