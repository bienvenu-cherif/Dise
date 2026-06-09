import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { MontantCotisation } from '../montants-cotisation/montant-cotisation.entity';
import { Cotisation } from './cotisation.entity';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { GenerateAnnualCotisationsDto } from './dto/generate-annual-cotisations.dto';
import { UpdateCotisationDto } from './dto/update-cotisation.dto';
import { User } from '../users/user.entity';

@Injectable()
export class CotisationsService {
  constructor(
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(InscriptionAnnuelle)
    private readonly inscriptionsRepository: Repository<InscriptionAnnuelle>,
    @InjectRepository(MontantCotisation)
    private readonly montantsRepository: Repository<MontantCotisation>,
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

  findAll(filters: { anneeAcademiqueId?: string; levelId?: string; status?: string } = {}): Promise<Cotisation[]> {
    const query = this.cotisationsRepository
      .createQueryBuilder('cotisation')
      .leftJoinAndSelect('cotisation.user', 'user')
      .leftJoinAndSelect('user.level', 'level')
      .leftJoinAndSelect('cotisation.anneeAcademique', 'anneeAcademique')
      .orderBy('cotisation.dueDate', 'DESC');

    if (filters.anneeAcademiqueId) {
      query.andWhere('anneeAcademique.id = :anneeAcademiqueId', { anneeAcademiqueId: filters.anneeAcademiqueId });
    }
    if (filters.levelId) {
      query.andWhere('level.id = :levelId', { levelId: filters.levelId });
    }
    if (filters.status) {
      query.andWhere('cotisation.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  findForUser(userId: string): Promise<Cotisation[]> {
    return this.cotisationsRepository.find({ where: { user: { id: userId } }, order: { dueDate: 'DESC' } });
  }

  async generateAnnualCotisations(dto: GenerateAnnualCotisationsDto) {
    const annee = await this.anneesRepository.findOne({ where: { id: dto.anneeAcademiqueId } });
    if (!annee) {
      throw new NotFoundException(`Annee academique avec id ${dto.anneeAcademiqueId} introuvable`);
    }
    if (annee.statut === 'fermee') {
      throw new BadRequestException('Impossible de generer des cotisations pour une annee fermee');
    }

    const inscriptions = await this.inscriptionsRepository.find({
      where: { anneeAcademique: { id: annee.id }, eligibleCotisation: true },
    });
    const created: Cotisation[] = [];
    const skipped: Array<{ userId: string; reason: string }> = [];

    for (const inscription of inscriptions) {
      if (!this.isStudentEligibleForAnnualCotisation(inscription)) {
        skipped.push({ userId: inscription.user.id, reason: 'Etudiant non eligible' });
        continue;
      }

      const existing = await this.cotisationsRepository.findOne({
        where: { user: { id: inscription.user.id }, anneeAcademique: { id: annee.id } },
      });
      if (existing) {
        skipped.push({ userId: inscription.user.id, reason: 'Cotisation deja generee' });
        continue;
      }

      const resolvedAmount = await this.resolveAnnualAmount(inscription, annee.id);
      if (!resolvedAmount || resolvedAmount.montant <= 0) {
        skipped.push({ userId: inscription.user.id, reason: 'Aucun montant valide defini' });
        continue;
      }

      const title = dto.title ?? `Cotisation ${annee.libelle} - ${inscription.level.name}`;
      const description =
        dto.description ??
        `Cotisation annuelle ${annee.libelle} pour ${inscription.level.name}`;

      const cotisation = this.cotisationsRepository.create({
        title,
        description,
        amount: resolvedAmount.montant,
        paidAmount: 0,
        dueDate: resolvedAmount.dateLimite,
        status: 'pending',
        paid: false,
        user: inscription.user,
        anneeAcademique: annee,
        sourceMontant: resolvedAmount.source,
      });
      created.push(await this.cotisationsRepository.save(cotisation));
    }

    annee.cotisationsGenereesLe = new Date();
    await this.anneesRepository.save(annee);

    return {
      anneeAcademique: {
        id: annee.id,
        libelle: annee.libelle,
      },
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    };
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

  async generateExport(userId?: string, status?: string, anneeAcademiqueId?: string, levelId?: string): Promise<Buffer> {
    const query = this.cotisationsRepository
      .createQueryBuilder('cotisation')
      .leftJoinAndSelect('cotisation.user', 'user')
      .leftJoinAndSelect('user.level', 'level')
      .leftJoinAndSelect('cotisation.anneeAcademique', 'anneeAcademique')
      .orderBy('cotisation.dueDate', 'DESC');

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }
    if (status) {
      query.andWhere('cotisation.status = :status', { status });
    }
    if (anneeAcademiqueId) {
      query.andWhere('anneeAcademique.id = :anneeAcademiqueId', { anneeAcademiqueId });
    }
    if (levelId) {
      query.andWhere('level.id = :levelId', { levelId });
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
        'Academic Year': item.anneeAcademique?.libelle || '',
        'Amount Source': item.sourceMontant || '',
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

  private isStudentEligibleForAnnualCotisation(inscription: InscriptionAnnuelle): boolean {
    if (!inscription.eligibleCotisation) {
      return false;
    }
    if (['abandon', 'exclu', 'alumni'].includes(inscription.statutScolaire)) {
      return false;
    }
    return inscription.level?.name?.toLowerCase() !== 'alumni';
  }

  private async resolveAnnualAmount(inscription: InscriptionAnnuelle, anneeAcademiqueId: string) {
    const exception = await this.montantsRepository.findOne({
      where: {
        anneeAcademique: { id: anneeAcademiqueId },
        user: { id: inscription.user.id },
        type: 'exception',
      },
    });
    if (exception) {
      return {
        montant: exception.montant,
        dateLimite: exception.dateLimite,
        source: 'exception',
      };
    }

    const montantNiveau = await this.montantsRepository.findOne({
      where: {
        anneeAcademique: { id: anneeAcademiqueId },
        level: { id: inscription.level.id },
        type: 'niveau',
      },
    });
    if (!montantNiveau) {
      return null;
    }

    return {
      montant: montantNiveau.montant,
      dateLimite: montantNiveau.dateLimite,
      source: 'niveau',
    };
  }
}
