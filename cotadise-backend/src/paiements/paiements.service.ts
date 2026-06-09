import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Paiement } from './paiement.entity';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { Cotisation } from '../cotisations/cotisation.entity';
import { User } from '../users/user.entity';

@Injectable()
export class PaiementsService {
  constructor(
    @InjectRepository(Paiement)
    private readonly paiementsRepository: Repository<Paiement>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
    const paiement = this.paiementsRepository.create({
      amount: createPaiementDto.amount,
      method: createPaiementDto.method,
      reference: createPaiementDto.reference,
      cotisation,
      user,
    });

    cotisation.paidAmount += createPaiementDto.amount;
    if (cotisation.paidAmount >= cotisation.amount) {
      cotisation.paid = true;
      cotisation.status = 'paid';
      cotisation.paidAt = new Date();
    } else {
      cotisation.status = 'partial';
    }

    await this.cotisationsRepository.save(cotisation);
    return this.paiementsRepository.save(paiement);
  }

  async generateExport(userId?: string): Promise<Buffer> {
    const query = this.paiementsRepository
      .createQueryBuilder('paiement')
      .leftJoinAndSelect('paiement.user', 'user')
      .leftJoinAndSelect('paiement.cotisation', 'cotisation')
      .orderBy('paiement.paidAt', 'DESC');

    if (userId) {
      query.where('user.id = :userId', { userId });
    }

    const paiements = await query.getMany();
    const worksheet = xlsx.utils.json_to_sheet(
      paiements.map((item) => ({
        'Paiement ID': item.id,
        'Amount': item.amount,
        'Method': item.method,
        'Reference': item.reference,
        'Paid At': item.paidAt ? item.paidAt.toISOString() : '',
        'User ID': item.user?.id || '',
        'User Email': item.user?.email || '',
        'Cotisation ID': item.cotisation?.id || '',
        'Cotisation Title': item.cotisation?.title || '',
        'Cotisation Amount': item.cotisation?.amount || '',
      })),
    );

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Paiements');
    return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  findAll(): Promise<Paiement[]> {
    return this.paiementsRepository.find({ order: { paidAt: 'DESC' } });
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
