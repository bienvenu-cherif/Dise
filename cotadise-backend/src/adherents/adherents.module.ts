import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdherentsController } from './adherents.controller';
import { AdherentsService } from './adherents.service';
import { Adherent } from './adherent.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Adherent, User])],
  controllers: [AdherentsController],
  providers: [AdherentsService],
})
export class AdherentsModule {}
