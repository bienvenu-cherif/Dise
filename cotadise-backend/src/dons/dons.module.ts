import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { DonAlumni } from './don-alumni.entity';
import { DonsController } from './dons.controller';
import { DonsService } from './dons.service';

@Module({
  imports: [TypeOrmModule.forFeature([DonAlumni, User])],
  controllers: [DonsController],
  providers: [DonsService],
})
export class DonsModule {}
