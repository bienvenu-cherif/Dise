import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';
import { CreateMontantCotisationDto } from './dto/create-montant-cotisation.dto';
import { UpdateMontantCotisationDto } from './dto/update-montant-cotisation.dto';
import { MontantCotisation } from './montant-cotisation.entity';

@Injectable()
export class MontantsCotisationService {
  constructor(
    @InjectRepository(MontantCotisation)
    private readonly montantsRepository: Repository<MontantCotisation>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(InscriptionAnnuelle)
    private readonly inscriptionsRepository: Repository<InscriptionAnnuelle>,
  ) {}

  async create(dto: CreateMontantCotisationDto): Promise<MontantCotisation> {
    this.validateScope(dto);
    const montant = await this.buildMontant(dto);
    return this.montantsRepository.save(montant);
  }

  findAll(): Promise<MontantCotisation[]> {
    return this.montantsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findByYear(anneeAcademiqueId: string): Promise<MontantCotisation[]> {
    return this.montantsRepository.find({
      where: { anneeAcademique: { id: anneeAcademiqueId } },
      order: { type: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MontantCotisation> {
    const montant = await this.montantsRepository.findOne({ where: { id } });
    if (!montant) {
      throw new NotFoundException(`Montant de cotisation avec id ${id} introuvable`);
    }
    return montant;
  }

  async update(id: string, dto: UpdateMontantCotisationDto): Promise<MontantCotisation> {
    const montant = await this.findOne(id);
    if (dto.type || dto.levelId || dto.userId) {
      this.validateScope({
        anneeAcademiqueId: dto.anneeAcademiqueId ?? montant.anneeAcademique.id,
        type: dto.type ?? montant.type,
        levelId: dto.levelId ?? montant.level?.id,
        userId: dto.userId ?? montant.user?.id,
        montant: dto.montant ?? montant.montant,
        dateLimite: dto.dateLimite ?? montant.dateLimite,
      });
    }
    if (dto.anneeAcademiqueId) {
      montant.anneeAcademique = await this.findAnnee(dto.anneeAcademiqueId);
    }
    if (dto.levelId) {
      montant.level = await this.findLevel(dto.levelId);
    }
    if (dto.userId) {
      montant.user = await this.findUser(dto.userId);
    }
    Object.assign(montant, {
      type: dto.type ?? montant.type,
      montant: dto.montant ?? montant.montant,
      dateLimite: dto.dateLimite ?? montant.dateLimite,
      commentaire: dto.commentaire ?? montant.commentaire,
    });
    return this.montantsRepository.save(montant);
  }

  async resoudreMontant(userId: string, anneeAcademiqueId: string) {
    const inscription = await this.inscriptionsRepository.findOne({
      where: { user: { id: userId }, anneeAcademique: { id: anneeAcademiqueId } },
    });
    if (!inscription) {
      throw new NotFoundException('Aucune inscription annuelle trouvee pour cet etudiant');
    }
    if (!inscription.eligibleCotisation) {
      return {
        eligibleCotisation: false,
        montant: 0,
        dateLimite: null,
        source: 'non-eligible',
      };
    }

    const exception = await this.montantsRepository.findOne({
      where: { anneeAcademique: { id: anneeAcademiqueId }, user: { id: userId }, type: 'exception' },
    });
    if (exception) {
      return {
        eligibleCotisation: true,
        montant: exception.montant,
        dateLimite: exception.dateLimite,
        source: 'exception',
      };
    }

    const montantNiveau = await this.montantsRepository.findOne({
      where: { anneeAcademique: { id: anneeAcademiqueId }, level: { id: inscription.level.id }, type: 'niveau' },
    });
    if (!montantNiveau) {
      throw new NotFoundException(`Aucun montant defini pour le niveau ${inscription.level.name}`);
    }

    return {
      eligibleCotisation: true,
      montant: montantNiveau.montant,
      dateLimite: montantNiveau.dateLimite,
      source: 'niveau',
    };
  }

  private validateScope(
    dto: Pick<CreateMontantCotisationDto, 'type' | 'levelId' | 'userId' | 'anneeAcademiqueId' | 'montant' | 'dateLimite' | 'commentaire'>,
  ): void {
    if (dto.type === 'niveau' && !dto.levelId) {
      throw new BadRequestException('Un montant de type niveau doit avoir un levelId');
    }
    if (dto.type === 'niveau' && dto.userId) {
      throw new BadRequestException('Un montant de type niveau ne doit pas avoir de userId');
    }
    if (dto.type === 'exception' && !dto.userId) {
      throw new BadRequestException('Un montant de type exception doit avoir un userId');
    }
  }

  private async buildMontant(dto: CreateMontantCotisationDto): Promise<MontantCotisation> {
    const [anneeAcademique, level, user] = await Promise.all([
      this.findAnnee(dto.anneeAcademiqueId),
      dto.levelId ? this.findLevel(dto.levelId) : Promise.resolve(undefined),
      dto.userId ? this.findUser(dto.userId) : Promise.resolve(undefined),
    ]);
    return this.montantsRepository.create({
      anneeAcademique,
      level,
      user,
      type: dto.type,
      montant: dto.montant,
      dateLimite: dto.dateLimite,
      commentaire: dto.commentaire,
    });
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

  private async findUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec id ${id} introuvable`);
    }
    return user;
  }
}
