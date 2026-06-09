import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { AcademicLevel } from './academic-level.entity';
import { Cotisation } from '../cotisations/cotisation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicLevel, Cotisation])],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
