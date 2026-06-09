import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';
import { AppliquerPassagesDto } from './dto/appliquer-passages.dto';
import { CreateInscriptionAnnuelleDto } from './dto/create-inscription-annuelle.dto';
import { UpdateInscriptionAnnuelleDto } from './dto/update-inscription-annuelle.dto';
import { InscriptionAnnuelle, StatutScolaire } from './inscription-annuelle.entity';

@Injectable()
export class InscriptionsAnnuellesService {
  constructor(
    @InjectRepository(InscriptionAnnuelle)
    private readonly inscriptionsRepository: Repository<InscriptionAnnuelle>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
  ) {}

  async create(dto: CreateInscriptionAnnuelleDto): Promise<InscriptionAnnuelle> {
    const [user, anneeAcademique, level] = await Promise.all([
      this.findUser(dto.userId),
      this.findAnnee(dto.anneeAcademiqueId),
      this.findLevel(dto.levelId),
    ]);
    const statutScolaire = dto.statutScolaire ?? 'actif';
    const inscription = this.inscriptionsRepository.create({
      user,
      anneeAcademique,
      level,
      statutScolaire,
      eligibleCotisation: dto.eligibleCotisation ?? this.isEligible(statutScolaire, level.name),
      commentaire: dto.commentaire,
    });
    user.level = level;
    user.role = level.name.toLowerCase() === 'alumni' ? 'alumni' : user.role;
    await this.usersRepository.save(user);
    return this.inscriptionsRepository.save(inscription);
  }

  findAll(): Promise<InscriptionAnnuelle[]> {
    return this.inscriptionsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findByYear(anneeAcademiqueId: string): Promise<InscriptionAnnuelle[]> {
    return this.inscriptionsRepository.find({
      where: { anneeAcademique: { id: anneeAcademiqueId } },
      order: { level: { name: 'ASC' }, user: { lastName: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<InscriptionAnnuelle> {
    const inscription = await this.inscriptionsRepository.findOne({ where: { id } });
    if (!inscription) {
      throw new NotFoundException(`Inscription annuelle avec id ${id} introuvable`);
    }
    return inscription;
  }

  async update(id: string, dto: UpdateInscriptionAnnuelleDto): Promise<InscriptionAnnuelle> {
    const inscription = await this.findOne(id);
    if (dto.userId) {
      inscription.user = await this.findUser(dto.userId);
    }
    if (dto.anneeAcademiqueId) {
      inscription.anneeAcademique = await this.findAnnee(dto.anneeAcademiqueId);
    }
    if (dto.levelId) {
      inscription.level = await this.findLevel(dto.levelId);
    }
    if (dto.statutScolaire) {
      inscription.statutScolaire = dto.statutScolaire;
    }
    if (dto.eligibleCotisation !== undefined) {
      inscription.eligibleCotisation = dto.eligibleCotisation;
    }
    if (dto.commentaire !== undefined) {
      inscription.commentaire = dto.commentaire;
    }
    inscription.eligibleCotisation = dto.eligibleCotisation ?? this.isEligible(inscription.statutScolaire, inscription.level.name);
    inscription.user.level = inscription.level;
    inscription.user.role = inscription.level.name.toLowerCase() === 'alumni' ? 'alumni' : inscription.user.role;
    await this.usersRepository.save(inscription.user);
    return this.inscriptionsRepository.save(inscription);
  }

  async previsualiserPassages(anneeSourceId: string) {
    const inscriptions = await this.findByYear(anneeSourceId);
    return inscriptions.map((inscription) => {
      const prochainNiveau = this.getProchainNiveau(inscription.level.name, inscription.statutScolaire);
      return {
        userId: inscription.user.id,
        nom: `${inscription.user.firstName} ${inscription.user.lastName}`,
        niveauActuel: inscription.level.name,
        statutScolaire: inscription.statutScolaire,
        prochainNiveau,
        eligibleCotisation: this.isEligible(inscription.statutScolaire, prochainNiveau),
      };
    });
  }

  async appliquerPassages(dto: AppliquerPassagesDto): Promise<InscriptionAnnuelle[]> {
    const [anneeCible, inscriptionsSource] = await Promise.all([
      this.findAnnee(dto.anneeCibleId),
      this.findByYear(dto.anneeSourceId),
    ]);
    const levels = await this.levelsRepository.find();
    const levelsByName = new Map(levels.map((level) => [level.name.toLowerCase(), level]));
    const created: InscriptionAnnuelle[] = [];

    for (const source of inscriptionsSource) {
      const alreadyExists = await this.inscriptionsRepository.findOne({
        where: { user: { id: source.user.id }, anneeAcademique: { id: anneeCible.id } },
      });
      if (alreadyExists) {
        continue;
      }

      const prochainNiveau = this.getProchainNiveau(source.level.name, source.statutScolaire);
      const level = levelsByName.get(prochainNiveau.toLowerCase());
      if (!level) {
        throw new BadRequestException(`Le niveau ${prochainNiveau} doit exister avant le passage automatique`);
      }

      const statutScolaire: StatutScolaire = prochainNiveau.toLowerCase() === 'alumni' ? 'alumni' : source.statutScolaire === 'redoublant' ? 'redoublant' : 'actif';
      const inscription = this.inscriptionsRepository.create({
        user: source.user,
        anneeAcademique: anneeCible,
        level,
        statutScolaire,
        eligibleCotisation: this.isEligible(statutScolaire, level.name),
        commentaire: source.statutScolaire === 'redoublant' ? 'Passage automatique: redoublement conserve' : 'Passage automatique',
      });
      source.user.level = level;
      source.user.role = level.name.toLowerCase() === 'alumni' ? 'alumni' : source.user.role;
      source.user.entrySource = 'passage_automatique';
      if (level.name.toLowerCase() === 'alumni') {
        source.user.promotionSortante = anneeCible.libelle;
      }
      await this.usersRepository.save(source.user);
      created.push(await this.inscriptionsRepository.save(inscription));
    }

    return created;
  }

  private async findUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    }
    return user;
  }

  private async findAnnee(id: string): Promise<AnneeAcademique> {
    const annee = await this.anneesRepository.findOne({ where: { id } });
    if (!annee) {
      throw new NotFoundException(`Annee academique avec id ${id} introuvable`);
    }
    return annee;
  }

  private async findLevel(id: string): Promise<AcademicLevel> {
    const level = await this.levelsRepository.findOne({ where: { id } });
    if (!level) {
      throw new NotFoundException(`Niveau avec id ${id} introuvable`);
    }
    return level;
  }

  private getProchainNiveau(niveau: string, statutScolaire: StatutScolaire): string {
    const normalized = niveau.toLowerCase();
    if (statutScolaire === 'redoublant') {
      return niveau;
    }
    if (statutScolaire === 'abandon' || statutScolaire === 'exclu') {
      return niveau;
    }
    if (normalized === 'ise1') {
      return 'ISE2';
    }
    if (normalized === 'ise2') {
      return 'ISE3';
    }
    if (normalized === 'ise3') {
      return 'alumni';
    }
    return niveau;
  }

  private isEligible(statutScolaire: StatutScolaire, niveau: string): boolean {
    if (statutScolaire === 'abandon' || statutScolaire === 'exclu' || statutScolaire === 'alumni') {
      return false;
    }
    return niveau.toLowerCase() !== 'alumni';
  }
}
