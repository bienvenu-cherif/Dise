import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Cotisation } from './cotisation.entity';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { UpdateCotisationDto } from './dto/update-cotisation.dto';
import { User } from '../users/user.entity';

@Injectable()
export class CotisationsService {
  constructor(
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createCotisationDto: CreateCotisationDto): Promise<Cotisation> {
    const user = await this.usersRepository.findOne({
      where: { id: createCotisationDto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${createCotisationDto.userId} not found`);
    }
    const cotisation = this.cotisationsRepository.create({
      title: createCotisationDto.title,
      description: createCotisationDto.description,
      amount: createCotisationDto.amount,
      paidAmount: 0,
      dueDate: createCotisationDto.dueDate,
      status: 'pending',
      paid: false,
      user,
    });
    return this.cotisationsRepository.save(cotisation);
  }

  findAll(): Promise<Cotisation[]> {
    return this.cotisationsRepository.find({ order: { dueDate: 'DESC' } });
  }

  findForUser(userId: string): Promise<Cotisation[]> {
    return this.cotisationsRepository.find({ where: { user: { id: userId } }, order: { dueDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Cotisation> {
    const cotisation = await this.cotisationsRepository.findOne({ where: { id } });
    if (!cotisation) {
      throw new NotFoundException(`Cotisation with id ${id} not found`);
    }
    return cotisation;
  }

  async update(id: string, updateCotisationDto: UpdateCotisationDto): Promise<Cotisation> {
    const cotisation = await this.findOne(id);
    if (updateCotisationDto.userId) {
      const user = await this.usersRepository.findOne({ where: { id: updateCotisationDto.userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${updateCotisationDto.userId} not found`);
      }
      cotisation.user = user;
    }
    Object.assign(cotisation, updateCotisationDto);
    return this.cotisationsRepository.save(cotisation);
  }

  async remove(id: string): Promise<void> {
    const result = await this.cotisationsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Cotisation with id ${id} not found`);
    }
  }

  async generateExport(userId?: string, status?: string): Promise<Buffer> {
    const query = this.cotisationsRepository
      .createQueryBuilder('cotisation')
      .leftJoinAndSelect('cotisation.user', 'user')
      .orderBy('cotisation.dueDate', 'DESC');

    if (userId) {
      query.where('user.id = :userId', { userId });
    }
    if (status) {
      query.andWhere('cotisation.status = :status', { status });
    }

    const cotisations = await query.getMany();
    const worksheet = xlsx.utils.json_to_sheet(
      cotisations.map((item) => ({
        'Cotisation ID': item.id,
        Title: item.title,
        Description: item.description || '',
        Amount: item.amount,
        'Paid Amount': item.paidAmount,
        'Remaining Amount': Math.max(0, item.amount - item.paidAmount),
        'Due Date': item.dueDate,
        Status: item.status,
        Paid: item.paid,
        'User ID': item.user?.id || '',
        'User Email': item.user?.email || '',
        'User First Name': item.user?.firstName || '',
        'User Last Name': item.user?.lastName || '',
      })),
    );
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Cotisations');
    return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}
