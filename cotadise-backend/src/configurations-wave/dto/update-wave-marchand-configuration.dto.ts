import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateWaveMarchandConfigurationDto } from './create-wave-marchand-configuration.dto';
import type { StatutConfigurationWave } from '../wave-marchand-configuration.entity';

export class UpdateWaveMarchandConfigurationDto extends PartialType(CreateWaveMarchandConfigurationDto) {
  @IsOptional()
  @IsIn(['brouillon', 'a_tester', 'validee', 'desactivee'])
  statut?: StatutConfigurationWave;
}
