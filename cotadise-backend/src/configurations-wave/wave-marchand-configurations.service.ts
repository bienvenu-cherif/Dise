import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { CreateWaveMarchandConfigurationDto } from './dto/create-wave-marchand-configuration.dto';
import { UpdateWaveMarchandConfigurationDto } from './dto/update-wave-marchand-configuration.dto';
import { WaveMarchandConfiguration } from './wave-marchand-configuration.entity';
import { WaveSecretVaultService } from './wave-secret-vault.service';

export type WaveRuntimeConfiguration = {
  id: string;
  nomCompte: string;
  checkoutUrl: string;
  apiKey: string;
  currency: string;
  successUrl?: string;
  errorUrl?: string;
  webhookUrl?: string;
  webhookSecret?: string;
};

@Injectable()
export class WaveMarchandConfigurationsService {
  constructor(
    @InjectRepository(WaveMarchandConfiguration)
    private readonly configurationsRepository: Repository<WaveMarchandConfiguration>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly vault: WaveSecretVaultService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateWaveMarchandConfigurationDto, configureParId?: string) {
    const anneeAcademique = await this.findAnnee(dto.anneeAcademiqueId);
    const configurePar = configureParId ? await this.usersRepository.findOne({ where: { id: configureParId } }) : undefined;
    const configuration = this.configurationsRepository.create({
      nomCompte: dto.nomCompte,
      nomBureau: dto.nomBureau,
      checkoutUrl: dto.checkoutUrl,
      currency: dto.currency ?? 'XOF',
      successUrl: dto.successUrl,
      errorUrl: dto.errorUrl,
      webhookUrl: dto.webhookUrl,
      apiKeyEncrypted: this.vault.encrypt(dto.apiKey),
      webhookSecretEncrypted: dto.webhookSecret ? this.vault.encrypt(dto.webhookSecret) : undefined,
      statut: 'a_tester',
      active: false,
      anneeAcademique,
      configurePar: configurePar ?? undefined,
    });
    const savedConfiguration = await this.configurationsRepository.save(configuration);
    await this.auditService.record({
      action: 'wave_configuration_created',
      entityType: 'wave_configuration',
      entityId: savedConfiguration.id,
      actorId: configureParId,
      details: this.auditDetails(savedConfiguration),
    });
    return this.safe(savedConfiguration);
  }

  async findAll(anneeAcademiqueId?: string) {
    const configurations = await this.configurationsRepository.find({
      where: anneeAcademiqueId ? { anneeAcademique: { id: anneeAcademiqueId } } : {},
      order: { createdAt: 'DESC' },
    });
    return configurations.map((configuration) => this.safe(configuration));
  }

  async findOne(id: string) {
    return this.safe(await this.findEntity(id));
  }

  async update(id: string, dto: UpdateWaveMarchandConfigurationDto) {
    const configuration = await this.findEntity(id);
    if (dto.anneeAcademiqueId) {
      configuration.anneeAcademique = await this.findAnnee(dto.anneeAcademiqueId);
    }
    if (dto.apiKey) {
      configuration.apiKeyEncrypted = this.vault.encrypt(dto.apiKey);
      configuration.statut = 'a_tester';
      configuration.active = false;
    }
    if (dto.webhookSecret !== undefined) {
      configuration.webhookSecretEncrypted = dto.webhookSecret ? this.vault.encrypt(dto.webhookSecret) : undefined;
    }
    Object.assign(configuration, {
      nomCompte: dto.nomCompte ?? configuration.nomCompte,
      nomBureau: dto.nomBureau ?? configuration.nomBureau,
      checkoutUrl: dto.checkoutUrl ?? configuration.checkoutUrl,
      currency: dto.currency ?? configuration.currency,
      successUrl: dto.successUrl ?? configuration.successUrl,
      errorUrl: dto.errorUrl ?? configuration.errorUrl,
      webhookUrl: dto.webhookUrl ?? configuration.webhookUrl,
      statut: dto.statut ?? configuration.statut,
    });
    const savedConfiguration = await this.configurationsRepository.save(configuration);
    await this.auditService.record({
      action: 'wave_configuration_updated',
      entityType: 'wave_configuration',
      entityId: savedConfiguration.id,
      details: this.auditDetails(savedConfiguration),
    });
    return this.safe(savedConfiguration);
  }

  async valider(id: string, valideParId?: string) {
    const configuration = await this.findEntity(id);
    const validePar = valideParId ? await this.usersRepository.findOne({ where: { id: valideParId } }) : undefined;
    configuration.statut = 'validee';
    configuration.valideeLe = new Date();
    configuration.validePar = validePar ?? undefined;
    const savedConfiguration = await this.configurationsRepository.save(configuration);
    await this.auditService.record({
      action: 'wave_configuration_validated',
      entityType: 'wave_configuration',
      entityId: savedConfiguration.id,
      actorId: valideParId,
      details: this.auditDetails(savedConfiguration),
    });
    return this.safe(savedConfiguration);
  }

  async activer(id: string, valideParId?: string) {
    const configuration = await this.findEntity(id);
    if (configuration.statut !== 'validee') {
      throw new BadRequestException('La configuration Wave doit etre validee avant activation');
    }
    await this.configurationsRepository.update(
      { anneeAcademique: { id: configuration.anneeAcademique.id }, active: true },
      { active: false, statut: 'desactivee' },
    );
    const validePar = valideParId ? await this.usersRepository.findOne({ where: { id: valideParId } }) : undefined;
    configuration.active = true;
    configuration.activeeLe = new Date();
    configuration.validePar = validePar ?? configuration.validePar;
    const savedConfiguration = await this.configurationsRepository.save(configuration);
    await this.auditService.record({
      action: 'wave_configuration_activated',
      entityType: 'wave_configuration',
      entityId: savedConfiguration.id,
      actorId: valideParId,
      details: this.auditDetails(savedConfiguration),
    });
    return this.safe(savedConfiguration);
  }

  async desactiver(id: string) {
    const configuration = await this.findEntity(id);
    configuration.active = false;
    configuration.statut = 'desactivee';
    const savedConfiguration = await this.configurationsRepository.save(configuration);
    await this.auditService.record({
      action: 'wave_configuration_disabled',
      entityType: 'wave_configuration',
      entityId: savedConfiguration.id,
      details: this.auditDetails(savedConfiguration),
    });
    return this.safe(savedConfiguration);
  }

  async getRuntimeForYear(anneeAcademiqueId?: string): Promise<WaveRuntimeConfiguration | undefined> {
    if (!anneeAcademiqueId) {
      return undefined;
    }
    const configuration = await this.configurationsRepository.findOne({
      where: { anneeAcademique: { id: anneeAcademiqueId }, active: true, statut: 'validee' },
    });
    if (!configuration) {
      return undefined;
    }
    return {
      id: configuration.id,
      nomCompte: configuration.nomCompte,
      checkoutUrl: configuration.checkoutUrl,
      apiKey: this.vault.decrypt(configuration.apiKeyEncrypted),
      currency: configuration.currency,
      successUrl: configuration.successUrl,
      errorUrl: configuration.errorUrl,
      webhookUrl: configuration.webhookUrl,
      webhookSecret: configuration.webhookSecretEncrypted ? this.vault.decrypt(configuration.webhookSecretEncrypted) : undefined,
    };
  }

  async getRuntimeById(id?: string): Promise<WaveRuntimeConfiguration | undefined> {
    if (!id) {
      return undefined;
    }
    const configuration = await this.configurationsRepository.findOne({ where: { id } });
    if (!configuration) {
      return undefined;
    }
    return {
      id: configuration.id,
      nomCompte: configuration.nomCompte,
      checkoutUrl: configuration.checkoutUrl,
      apiKey: this.vault.decrypt(configuration.apiKeyEncrypted),
      currency: configuration.currency,
      successUrl: configuration.successUrl,
      errorUrl: configuration.errorUrl,
      webhookUrl: configuration.webhookUrl,
      webhookSecret: configuration.webhookSecretEncrypted ? this.vault.decrypt(configuration.webhookSecretEncrypted) : undefined,
    };
  }

  async markTested(id: string, reference: string) {
    const configuration = await this.findEntity(id);
    configuration.dernierTestLe = new Date();
    configuration.derniereReferenceTest = reference;
    await this.configurationsRepository.save(configuration);
  }

  private async findEntity(id: string) {
    const configuration = await this.configurationsRepository.findOne({ where: { id } });
    if (!configuration) {
      throw new NotFoundException(`Configuration Wave ${id} introuvable`);
    }
    return configuration;
  }

  private async findAnnee(id: string) {
    const annee = await this.anneesRepository.findOne({ where: { id } });
    if (!annee) {
      throw new NotFoundException(`Annee academique ${id} introuvable`);
    }
    return annee;
  }

  private safe(configuration: WaveMarchandConfiguration) {
    const { apiKeyEncrypted, webhookSecretEncrypted, ...safeConfiguration } = configuration;
    return {
      ...safeConfiguration,
      apiKeyConfigured: Boolean(apiKeyEncrypted),
      webhookSecretConfigured: Boolean(webhookSecretEncrypted),
    };
  }

  private auditDetails(configuration: WaveMarchandConfiguration) {
    return {
      anneeAcademiqueId: configuration.anneeAcademique?.id,
      anneeAcademique: configuration.anneeAcademique?.libelle,
      nomCompte: configuration.nomCompte,
      nomBureau: configuration.nomBureau,
      statut: configuration.statut,
      active: configuration.active,
      checkoutUrl: configuration.checkoutUrl,
      webhookConfigured: Boolean(configuration.webhookSecretEncrypted),
    };
  }
}
