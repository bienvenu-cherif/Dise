import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { rowsToXlsxBuffer } from '../common/excel.helper';
import { Paiement } from './paiement.entity';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { Cotisation } from '../cotisations/cotisation.entity';
import { DefisService } from '../defis/defis.service';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WaveMarchandConfiguration } from '../configurations-wave/wave-marchand-configuration.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaiementsService {
  constructor(
    @InjectRepository(Paiement)
    private readonly paiementsRepository: Repository<Paiement>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(WaveMarchandConfiguration)
    private readonly waveConfigurationsRepository: Repository<WaveMarchandConfiguration>,
    private readonly notificationsService: NotificationsService,
    private readonly defisService: DefisService,
    private readonly auditService: AuditService,
  ) {}

  async create(createPaiementDto: CreatePaiementDto): Promise<Paiement> {
    const cotisation = await this.cotisationsRepository.findOne({ where: { id: createPaiementDto.cotisationId } });
    if (!cotisation) {
      throw new NotFoundException(`Cotisation with id ${createPaiementDto.cotisationId} not found`);
    }
    if (!createPaiementDto.userId) {
      throw new NotFoundException('userId is required');
    }
    const user = await this.usersRepository.findOne({ where: { id: createPaiementDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${createPaiementDto.userId} not found`);
    }
    this.validatePaymentTarget(cotisation, user, createPaiementDto);
    const payer = createPaiementDto.payerId
      ? await this.usersRepository.findOne({ where: { id: createPaiementDto.payerId } })
      : undefined;
    if (createPaiementDto.payerId && !payer) {
      throw new NotFoundException(`Payer with id ${createPaiementDto.payerId} not found`);
    }
    const recordedBy = createPaiementDto.recordedById
      ? await this.usersRepository.findOne({ where: { id: createPaiementDto.recordedById } })
      : undefined;
    if (createPaiementDto.recordedById && !recordedBy) {
      throw new NotFoundException(`Recorder with id ${createPaiementDto.recordedById} not found`);
    }
    const waveConfiguration = createPaiementDto.waveConfigurationId
      ? await this.waveConfigurationsRepository.findOne({ where: { id: createPaiementDto.waveConfigurationId } })
      : undefined;
    if (createPaiementDto.waveConfigurationId && !waveConfiguration) {
      throw new NotFoundException(`Wave configuration with id ${createPaiementDto.waveConfigurationId} not found`);
    }
    const paiement = new Paiement();
    paiement.amount = createPaiementDto.amount;
    paiement.method = createPaiementDto.method ?? (createPaiementDto.origin === 'main_a_main' ? 'Especes' : 'Wave');
    paiement.reference = createPaiementDto.reference;
    paiement.status = createPaiementDto.status ?? 'confirme';
    paiement.origin = createPaiementDto.origin ?? 'paiement_personnel';
    paiement.payerPhone = createPaiementDto.payerPhone ?? payer?.wavePhone ?? user.wavePhone ?? user.phone;
    paiement.note = createPaiementDto.note;
    paiement.cotisation = cotisation;
    paiement.user = user;
    paiement.payer = payer ?? undefined;
    paiement.recordedBy = recordedBy ?? undefined;
    paiement.waveConfiguration = waveConfiguration ?? undefined;

    const savedPaiement: Paiement = await this.paiementsRepository.save(paiement);
    await this.auditService.record({
      action: savedPaiement.origin === 'main_a_main' ? 'payment_cash_created' : 'payment_created',
      entityType: 'paiement',
      entityId: savedPaiement.id,
      actorId: recordedBy?.id ?? payer?.id,
      actorType: recordedBy || payer ? 'user' : 'system',
      details: this.paymentAuditDetails(savedPaiement),
    });

    if (savedPaiement.status === 'confirme') {
      await this.applyConfirmedPaymentEffects(savedPaiement);
    }

    return savedPaiement;
  }

  async confirmByReference(reference: string, metadata?: Record<string, unknown>): Promise<Paiement> {
    const paiement = await this.findByReference(reference);
    if (paiement.status === 'confirme') {
      return paiement;
    }

    const updateResult = await this.paiementsRepository.update(
      { reference, status: Not('confirme') },
      { status: 'confirme', note: this.appendNote(paiement.note, metadata) },
    );
    if (!updateResult.affected) {
      return this.findByReference(reference);
    }
    const savedPaiement = await this.findByReference(reference);
    await this.auditService.record({
      action: 'payment_confirmed_by_reference',
      entityType: 'paiement',
      entityId: savedPaiement.id,
      actorType: 'wave_webhook',
      details: this.paymentAuditDetails(savedPaiement, metadata),
    });
    await this.applyConfirmedPaymentEffects(savedPaiement);
    return savedPaiement;
  }

  async markByReference(reference: string, status: string, metadata?: Record<string, unknown>): Promise<Paiement> {
    const paiement = await this.findByReference(reference);
    if (paiement.status === 'confirme') {
      return paiement;
    }

    paiement.status = status;
    paiement.note = this.appendNote(paiement.note, metadata);
    const savedPaiement = await this.paiementsRepository.save(paiement);
    await this.auditService.record({
      action: 'payment_status_changed_by_reference',
      entityType: 'paiement',
      entityId: savedPaiement.id,
      actorType: 'wave_webhook',
      details: this.paymentAuditDetails(savedPaiement, metadata),
    });
    return savedPaiement;
  }

  async findByReference(reference: string): Promise<Paiement> {
    const paiement = await this.paiementsRepository.findOne({ where: { reference } });
    if (!paiement) {
      throw new NotFoundException(`Paiement avec reference ${reference} introuvable`);
    }
    return paiement;
  }

  async generateExport(userId?: string, anneeAcademiqueId?: string, levelId?: string): Promise<Buffer> {
    const query = this.paiementsRepository
      .createQueryBuilder('paiement')
      .leftJoinAndSelect('paiement.user', 'user')
      .leftJoinAndSelect('user.level', 'level')
      .leftJoinAndSelect('paiement.cotisation', 'cotisation')
      .leftJoinAndSelect('cotisation.anneeAcademique', 'anneeAcademique')
      .orderBy('paiement.paidAt', 'DESC');

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }
    if (anneeAcademiqueId) {
      query.andWhere('anneeAcademique.id = :anneeAcademiqueId', { anneeAcademiqueId });
    }
    if (levelId) {
      query.andWhere('level.id = :levelId', { levelId });
    }

    const paiements = await query.getMany();
    return rowsToXlsxBuffer(
      paiements.map((item) => ({
        'Paiement ID': item.id,
        'Amount': item.amount,
        'Applied Amount': item.appliedAmount || 0,
        'Method': item.method,
        'Reference': item.reference,
        'Status': item.status,
        'Origin': item.origin,
        'Payer Phone': item.payerPhone || '',
        'Paid At': item.paidAt ? item.paidAt.toISOString() : '',
        'User ID': item.user?.id || '',
        'User Email': item.user?.email || '',
        'Payer ID': item.payer?.id || '',
        'Payer Email': item.payer?.email || '',
        'Recorded By ID': item.recordedBy?.id || '',
        'Wave Configuration': item.waveConfiguration?.nomCompte || '',
        'Cotisation ID': item.cotisation?.id || '',
        'Cotisation Title': item.cotisation?.title || '',
        'Cotisation Amount': item.cotisation?.amount || '',
      })),
      'Paiements',
    );
  }

  findAll(filters: { anneeAcademiqueId?: string; levelId?: string } = {}): Promise<Paiement[]> {
    const query = this.paiementsRepository
      .createQueryBuilder('paiement')
      .leftJoinAndSelect('paiement.user', 'user')
      .leftJoinAndSelect('user.level', 'level')
      .leftJoinAndSelect('paiement.cotisation', 'cotisation')
      .leftJoinAndSelect('cotisation.anneeAcademique', 'anneeAcademique')
      .orderBy('paiement.paidAt', 'DESC');

    if (filters.anneeAcademiqueId) {
      query.andWhere('anneeAcademique.id = :anneeAcademiqueId', { anneeAcademiqueId: filters.anneeAcademiqueId });
    }
    if (filters.levelId) {
      query.andWhere('level.id = :levelId', { levelId: filters.levelId });
    }

    return query.getMany();
  }

  findForUser(userId: string): Promise<Paiement[]> {
    return this.paiementsRepository.find({ where: { user: { id: userId } }, order: { paidAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Paiement> {
    const paiement = await this.paiementsRepository.findOne({ where: { id } });
    if (!paiement) {
      throw new NotFoundException(`Paiement with id ${id} not found`);
    }
    return paiement;
  }

  async update(id: string, updatePaiementDto: UpdatePaiementDto): Promise<Paiement> {
    const paiement = await this.findOne(id);
    if (updatePaiementDto.cotisationId) {
      const cotisation = await this.cotisationsRepository.findOne({ where: { id: updatePaiementDto.cotisationId } });
      if (!cotisation) {
        throw new NotFoundException(`Cotisation with id ${updatePaiementDto.cotisationId} not found`);
      }
      paiement.cotisation = cotisation;
    }
    if (updatePaiementDto.userId) {
      const user = await this.usersRepository.findOne({ where: { id: updatePaiementDto.userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${updatePaiementDto.userId} not found`);
      }
      paiement.user = user;
    }
    Object.assign(paiement, updatePaiementDto);
    return this.paiementsRepository.save(paiement);
  }

  async remove(id: string): Promise<void> {
    const result = await this.paiementsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Paiement with id ${id} not found`);
    }
  }

  private async applyConfirmedPaymentEffects(paiement: Paiement): Promise<void> {
    if (paiement.appliedAt) {
      return;
    }
    const cotisation = await this.cotisationsRepository.findOne({ where: { id: paiement.cotisation.id } });
    if (!cotisation) {
      throw new NotFoundException(`Cotisation with id ${paiement.cotisation.id} not found`);
    }
    const remainingAmount = Math.max(0, cotisation.amount - cotisation.paidAmount);
    const appliedAmount = Math.min(remainingAmount, paiement.amount);
    cotisation.paidAmount += appliedAmount;
    if (cotisation.paidAmount >= cotisation.amount) {
      cotisation.paid = true;
      cotisation.status = 'paid';
      cotisation.paidAt = new Date();
    } else if (cotisation.paidAmount > 0) {
      cotisation.status = 'partial';
    }
    await this.cotisationsRepository.save(cotisation);
    paiement.appliedAmount = appliedAmount;
    paiement.appliedAt = new Date();
    if (appliedAmount < paiement.amount) {
      paiement.note = this.appendNote(paiement.note, {
        warning: 'Montant confirme superieur au reste a payer',
        appliedAmount,
        excessAmount: paiement.amount - appliedAmount,
      });
    }
    await this.paiementsRepository.save(paiement);
    await this.auditService.record({
      action: 'payment_applied_to_cotisation',
      entityType: 'paiement',
      entityId: paiement.id,
      actorType: 'application',
      details: {
        ...this.paymentAuditDetails(paiement),
        cotisationId: cotisation.id,
        cotisationStatus: cotisation.status,
        cotisationPaidAmount: cotisation.paidAmount,
      },
    });
    await this.notificationsService.notifyPaymentConfirmed(paiement);
    await this.defisService.refreshChallengesForUser(paiement.user.id, paiement.cotisation?.anneeAcademique?.id);
  }

  private validatePaymentTarget(cotisation: Cotisation, user: User, dto: CreatePaiementDto): void {
    if (cotisation.user.id !== user.id) {
      throw new BadRequestException('La cotisation choisie ne correspond pas au beneficiaire du paiement');
    }
    if (!user.isActive || user.accountStatus !== 'actif' || user.role !== 'etudiant') {
      throw new BadRequestException('Le beneficiaire du paiement n est pas un etudiant actif');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Le montant du paiement doit etre positif');
    }
    if (cotisation.paid || cotisation.status === 'paid') {
      throw new BadRequestException('Cette cotisation est deja soldee');
    }
    const remainingAmount = Math.max(0, cotisation.amount - cotisation.paidAmount);
    if (dto.amount > remainingAmount && dto.origin !== 'ajustement_tresorier') {
      throw new BadRequestException(`Le montant depasse le reste a payer (${remainingAmount})`);
    }
  }

  private appendNote(note?: string, metadata?: Record<string, unknown>) {
    if (!metadata) {
      return note;
    }
    const serialized = JSON.stringify(metadata);
    return note ? `${note}\n${serialized}` : serialized;
  }

  private paymentAuditDetails(paiement: Paiement, metadata?: Record<string, unknown>) {
    return {
      amount: paiement.amount,
      appliedAmount: paiement.appliedAmount || 0,
      method: paiement.method,
      reference: paiement.reference,
      status: paiement.status,
      origin: paiement.origin,
      userId: paiement.user?.id,
      payerId: paiement.payer?.id,
      recordedById: paiement.recordedBy?.id,
      cotisationId: paiement.cotisation?.id,
      waveConfigurationId: paiement.waveConfiguration?.id,
      metadata,
    };
  }
}
