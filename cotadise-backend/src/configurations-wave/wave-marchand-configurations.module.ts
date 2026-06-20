import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { AuditModule } from '../audit/audit.module';
import { User } from '../users/user.entity';
import { WaveMarchandConfigurationsController } from './wave-marchand-configurations.controller';
import { WaveMarchandConfiguration } from './wave-marchand-configuration.entity';
import { WaveMarchandConfigurationsService } from './wave-marchand-configurations.service';
import { WaveSecretVaultService } from './wave-secret-vault.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaveMarchandConfiguration, AnneeAcademique, User]), AuditModule],
  controllers: [WaveMarchandConfigurationsController],
  providers: [WaveMarchandConfigurationsService, WaveSecretVaultService],
  exports: [WaveMarchandConfigurationsService, WaveSecretVaultService],
})
export class WaveMarchandConfigurationsModule {}
