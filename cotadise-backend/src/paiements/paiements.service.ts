import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Paiement } from './paiement.entity';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { Cotisation } from '../cotisations/cotisation.entity';
import { DefisService } from '../defis/defis.service';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaiementsService {
  constructor(
    @InjectRepository(Paiement)
    private readonly paiementsRepository: Repository<Paiement>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly defisService: DefisService,
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
    const paiement = this.paiementsRepository.create({
      amount: createPaiementDto.amount,
      method: createPaiementDto.method ?? (createPaiementDto.origin === 'main_a_main' ? 'Especes' : 'Wave'),
      reference: createPaiementDto.reference,
      status: createPaiementDto.status ?? 'confirme',
      origin: createPaiementDto.origin ?? 'paiement_personnel',
      payerPhone: createPaiementDto.payerPhone ?? payer?.wavePhone ?? user.wavePhone ?? user.phone,
      note: createPaiementDto.note,
      cotisation,
      user,
      payer,
      recordedBy,
    });

    if (paiement.status === 'confirme') {
      cotisation.paidAmount += createPaiementDto.amount;
      if (cotisation.paidAmount >= cotisation.amount) {
        cotisation.paid = true;
        cotisation.status = 'paid';
        cotisation.paidAt = new Date();
      } else {
        cotisation.status = 'partial';
      }
      await this.cotisationsRepository.save(cotisation);
    }

    const savedPaiement = await this.paiementsRepository.save(paiement);

    if (savedPaiement.status === 'confirme') {
      await this.notificationsService.notifyPaymentConfirmed(savedPaiement);
      await this.defisService.refreshChallengesForUser(savedPaiement.user.id, savedPaiement.cotisation?.anneeAcademique?.id);
    }

    return savedPaiement;
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
    const worksheet = xlsx.utils.json_to_sheet(
      paiements.map((item) => ({
        'Paiement ID': item.id,
        'Amount': item.amount,
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
        'Cotisation ID': item.cotisation?.id || '',
        'Cotisation Title': item.cotisation?.title || '',
        'Cotisation Amount': item.cotisation?.amount || '',
      })),
    );

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Paiements');
    return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
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
}
