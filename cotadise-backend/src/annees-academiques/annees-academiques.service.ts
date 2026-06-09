import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnneeAcademique } from './annee-academique.entity';
import { CreateAnneeAcademiqueDto } from './dto/create-annee-academique.dto';
import { UpdateAnneeAcademiqueDto } from './dto/update-annee-academique.dto';

@Injectable()
export class AnneesAcademiquesService {
  constructor(
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
  ) {}

  create(dto: CreateAnneeAcademiqueDto): Promise<AnneeAcademique> {
    return this.anneesRepository.save(this.anneesRepository.create(dto));
  }

  findAll(): Promise<AnneeAcademique[]> {
    return this.anneesRepository.find({ order: { dateDebut: 'DESC' } });
  }

  async findActive(): Promise<AnneeAcademique> {
    const annee = await this.anneesRepository.findOne({ where: { active: true } });
    if (!annee) {
      throw new NotFoundException('Aucune annee academique active');
    }
    return annee;
  }

  async findOne(id: string): Promise<AnneeAcademique> {
    const annee = await this.anneesRepository.findOne({ where: { id } });
    if (!annee) {
      throw new NotFoundException(`Annee academique avec id ${id} introuvable`);
    }
    return annee;
  }

  async update(id: string, dto: UpdateAnneeAcademiqueDto): Promise<AnneeAcademique> {
    const annee = await this.findOne(id);
    Object.assign(annee, dto);
    return this.anneesRepository.save(annee);
  }

  async ouvrir(id: string): Promise<AnneeAcademique> {
    const annee = await this.findOne(id);
    await this.anneesRepository.update({ active: true }, { active: false });
    annee.active = true;
    annee.statut = 'ouverte';
    return this.anneesRepository.save(annee);
  }

  async fermer(id: string): Promise<AnneeAcademique> {
    const annee = await this.findOne(id);
    annee.active = false;
    annee.statut = 'fermee';
    return this.anneesRepository.save(annee);
  }
}
