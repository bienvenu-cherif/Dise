import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Adherent } from './adherent.entity';
import { CreateAdherentDto } from './dto/create-adherent.dto';
import { UpdateAdherentDto } from './dto/update-adherent.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AdherentsService {
  constructor(
    @InjectRepository(Adherent)
    private readonly adherentsRepository: Repository<Adherent>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createAdherentDto: CreateAdherentDto): Promise<Adherent> {
    const user = await this.usersRepository.findOne({ where: { id: createAdherentDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${createAdherentDto.userId} not found`);
    }
    const adherent = this.adherentsRepository.create({
      membershipNumber: createAdherentDto.membershipNumber,
      user,
      address: createAdherentDto.address,
      birthDate: createAdherentDto.birthDate,
      status: createAdherentDto.status || 'active',
    });
    return this.adherentsRepository.save(adherent);
  }

  findAll(): Promise<Adherent[]> {
    return this.adherentsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<Adherent | null> {
    return this.adherentsRepository.findOne({ where: { id } });
  }

  findByUser(userId: string): Promise<Adherent | null> {
    return this.adherentsRepository.findOne({ where: { user: { id: userId } } });
  }

  async update(id: string, updateAdherentDto: UpdateAdherentDto): Promise<Adherent> {
    const adherent = await this.adherentsRepository.findOne({ where: { id } });
    if (!adherent) {
      throw new NotFoundException(`Adherent with id ${id} not found`);
    }
    if (updateAdherentDto.userId) {
      const user = await this.usersRepository.findOne({ where: { id: updateAdherentDto.userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${updateAdherentDto.userId} not found`);
      }
      adherent.user = user;
    }
    Object.assign(adherent, updateAdherentDto);
    return this.adherentsRepository.save(adherent);
  }

  async remove(id: string): Promise<void> {
    const result = await this.adherentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Adherent with id ${id} not found`);
    }
  }

  async generateExport(status?: string): Promise<Buffer> {
    const query = this.adherentsRepository.createQueryBuilder('adherent').leftJoinAndSelect('adherent.user', 'user');
    if (status) {
      query.where('adherent.status = :status', { status });
    }
    const adherents = await query.orderBy('adherent.createdAt', 'DESC').getMany();

    const worksheet = xlsx.utils.json_to_sheet(
      adherents.map((item) => ({
        'Adherent ID': item.id,
        'Membership Number': item.membershipNumber,
        'Status': item.status,
        'Address': item.address || '',
        'Birth Date': item.birthDate || '',
        'User ID': item.user?.id || '',
        'User First Name': item.user?.firstName || '',
        'User Last Name': item.user?.lastName || '',
        'User Email': item.user?.email || '',
      })),
    );

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Adherents');
    return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}
