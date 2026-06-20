import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rowsToXlsxBuffer } from '../common/excel.helper';
import { User } from '../users/user.entity';
import { DonAlumni } from './don-alumni.entity';
import { CreateDonAlumniDto } from './dto/create-don-alumni.dto';

@Injectable()
export class DonsService {
  constructor(
    @InjectRepository(DonAlumni)
    private readonly donsRepository: Repository<DonAlumni>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateDonAlumniDto): Promise<DonAlumni> {
    if (!dto.alumniId) {
      throw new BadRequestException('alumniId est requis');
    }

    const alumni = await this.findAlumni(dto.alumniId);
    const recordedBy = dto.recordedById ? await this.findUser(dto.recordedById) : undefined;
    const don = this.donsRepository.create({
      alumni,
      recordedBy,
      amount: dto.amount,
      method: dto.method ?? (dto.origin === 'don_main_a_main' ? 'Especes' : 'Wave'),
      status: (dto.status ?? 'confirme') as any,
      origin: (dto.origin ?? 'don_wave') as any,
      reference: dto.reference,
      payerPhone: dto.payerPhone ?? alumni.wavePhone ?? alumni.phone,
      message: dto.message,
    });

    return this.donsRepository.save(don);
  }

  findAll(filters: { promotion?: string; status?: string } = {}): Promise<DonAlumni[]> {
    const query = this.donsRepository
      .createQueryBuilder('don')
      .leftJoinAndSelect('don.alumni', 'alumni')
      .leftJoinAndSelect('don.recordedBy', 'recordedBy')
      .orderBy('don.donatedAt', 'DESC');

    if (filters.promotion) {
      query.andWhere('alumni.promotionSortante = :promotion', { promotion: filters.promotion });
    }
    if (filters.status) {
      query.andWhere('don.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  findForAlumni(alumniId: string): Promise<DonAlumni[]> {
    return this.donsRepository.find({
      where: { alumni: { id: alumniId } },
      order: { donatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DonAlumni> {
    const don = await this.donsRepository.findOne({ where: { id } });
    if (!don) {
      throw new NotFoundException(`Don avec id ${id} introuvable`);
    }
    return don;
  }

  async generateExport(filters: { promotion?: string; status?: string } = {}): Promise<Buffer> {
    const dons = await this.findAll(filters);
    const rows = dons.map((don) => ({
      'Don ID': don.id,
      'Montant': don.amount,
      'Methode': don.method,
      'Statut': don.status,
      'Origine': don.origin,
      'Reference': don.reference || '',
      'Telephone payeur': don.payerPhone || '',
      'Message': don.message || '',
      'Date': don.donatedAt ? don.donatedAt.toISOString() : '',
      'Alumni ID': don.alumni?.id || '',
      'Alumni': `${don.alumni?.firstName ?? ''} ${don.alumni?.lastName ?? ''}`.trim(),
      'Promotion': don.alumni?.promotionSortante || '',
      'Enregistre par': don.recordedBy ? `${don.recordedBy.firstName} ${don.recordedBy.lastName}` : '',
    }));

    return rowsToXlsxBuffer(rows, 'Dons alumni');
  }

  private async findAlumni(id: string): Promise<User> {
    const user = await this.findUser(id);
    if (user.role !== 'alumni') {
      throw new BadRequestException('Seuls les alumni peuvent etre rattaches a un don alumni');
    }
    return user;
  }

  private async findUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    }
    return user;
  }
}
