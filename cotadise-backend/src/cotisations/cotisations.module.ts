import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotisationsController } from './cotisations.controller';
import { CotisationsService } from './cotisations.service';
import { Cotisation } from './cotisation.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cotisation, User])],
  controllers: [CotisationsController],
  providers: [CotisationsService],
})
export class CotisationsModule {}
