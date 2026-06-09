import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cotisation } from '../cotisations/cotisation.entity';
import { AcademicLevel } from './academic-level.entity';
import { CreateAcademicLevelDto } from './dto/create-academic-level.dto';
import { UpdateAcademicLevelDto } from './dto/update-academic-level.dto';
import { GenerateAcademicLevelCotisationsDto } from './dto/generate-academic-level-cotisations.dto';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
  ) {}

  async create(createAcademicLevelDto: CreateAcademicLevelDto): Promise<AcademicLevel> {
    const level = this.levelsRepository.create(createAcademicLevelDto);
    return this.levelsRepository.save(level);
  }

  findAll(): Promise<AcademicLevel[]> {
    return this.levelsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<AcademicLevel> {
    const level = await this.levelsRepository.findOne({ where: { id } });
    if (!level) {
      throw new NotFoundException(`Academic level with id ${id} not found`);
    }
    return level;
  }

  async update(id: string, updateAcademicLevelDto: UpdateAcademicLevelDto): Promise<AcademicLevel> {
    const level = await this.findOne(id);
    Object.assign(level, updateAcademicLevelDto);
    return this.levelsRepository.save(level);
  }

  async generateCotisationsForLevel(
    id: string,
    generateAcademicLevelCotisationsDto: GenerateAcademicLevelCotisationsDto,
  ): Promise<Cotisation[]> {
    const level = await this.levelsRepository.findOne({
      where: { id },
      relations: { users: true },
    });
    if (!level) {
      throw new NotFoundException(`Academic level with id ${id} not found`);
    }

    const users = level.users ?? [];
    const cotisations = users.map((user) =>
      this.cotisationsRepository.create({
        title: generateAcademicLevelCotisationsDto.title || `${level.name} cotisation`,
        description:
          generateAcademicLevelCotisationsDto.description ??
          `Cotisation due for ${level.name}`,
        amount: level.annualAmount,
        paidAmount: 0,
        dueDate: generateAcademicLevelCotisationsDto.dueDate,
        status: 'pending',
        paid: false,
        user,
      }),
    );

    return this.cotisationsRepository.save(cotisations);
  }

  async remove(id: string): Promise<void> {
    const result = await this.levelsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Academic level with id ${id} not found`);
    }
  }
}
