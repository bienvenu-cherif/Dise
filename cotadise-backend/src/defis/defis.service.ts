import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { Defi } from './defi.entity';
import { CreateDefiDto } from './dto/create-defi.dto';

@Injectable()
export class DefisService {
  constructor(
    @InjectRepository(Defi)
    private readonly defisRepository: Repository<Defi>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(challengerId: string, dto: CreateDefiDto): Promise<Defi> {
    if (challengerId === dto.opponentId) {
      throw new BadRequestException('Un etudiant ne peut pas se lancer un defi a lui-meme');
    }

    const [challenger, opponent, anneeAcademique] = await Promise.all([
      this.findUser(challengerId),
      this.findUser(dto.opponentId),
      dto.anneeAcademiqueId ? this.findAnnee(dto.anneeAcademiqueId) : this.findActiveYear(),
    ]);

    this.ensureEligibleStudent(challenger);
    this.ensureEligibleStudent(opponent);
    await this.ensureCotisationsExist(challenger.id, opponent.id, anneeAcademique.id);

    const existing = await this.defisRepository.findOne({
      where: [
        {
          challenger: { id: challenger.id },
          opponent: { id: opponent.id },
          anneeAcademique: { id: anneeAcademique.id },
          status: In(['en_attente', 'accepte']),
        },
        {
          challenger: { id: opponent.id },
          opponent: { id: challenger.id },
          anneeAcademique: { id: anneeAcademique.id },
          status: In(['en_attente', 'accepte']),
        },
      ],
    });
    if (existing) {
      throw new BadRequestException('Un defi actif existe deja entre ces deux etudiants pour cette annee');
    }

    const defi = await this.defisRepository.save(
      this.defisRepository.create({
        challenger,
        opponent,
        anneeAcademique,
        message: dto.message,
        status: 'en_attente',
      }),
    );

    await this.notificationsService.notifyChallengeReceived(opponent, challenger, {
      defiId: defi.id,
      anneeAcademiqueId: anneeAcademique.id,
      message: dto.message,
    });

    return defi;
  }

  async findForUser(userId: string) {
    const defis = await this.defisRepository.find({
      where: [{ challenger: { id: userId } }, { opponent: { id: userId } }],
      order: { createdAt: 'DESC' },
    });
    return Promise.all(defis.map((defi) => this.withProgress(defi)));
  }

  async findAll() {
    const defis = await this.defisRepository.find({
      order: { createdAt: 'DESC' },
    });
    return Promise.all(defis.map((defi) => this.withProgress(defi)));
  }

  async findOneForUser(id: string, userId: string) {
    const defi = await this.findOne(id);
    this.ensureParticipant(defi, userId);
    return this.withProgress(defi);
  }

  async accept(id: string, userId: string): Promise<Defi> {
    const defi = await this.findOne(id);
    if (defi.opponent.id !== userId) {
      throw new ForbiddenException('Seul le destinataire du defi peut l accepter');
    }
    if (defi.status !== 'en_attente') {
      throw new BadRequestException('Ce defi ne peut plus etre accepte');
    }

    defi.status = 'accepte';
    defi.acceptedAt = new Date();
    await this.defisRepository.save(defi);
    return this.evaluateWinner(defi);
  }

  async refuse(id: string, userId: string): Promise<Defi> {
    const defi = await this.findOne(id);
    if (defi.opponent.id !== userId) {
      throw new ForbiddenException('Seul le destinataire du defi peut le refuser');
    }
    if (defi.status !== 'en_attente') {
      throw new BadRequestException('Ce defi ne peut plus etre refuse');
    }

    defi.status = 'refuse';
    defi.refusedAt = new Date();
    return this.defisRepository.save(defi);
  }

  async cancel(id: string, userId: string): Promise<Defi> {
    const defi = await this.findOne(id);
    if (defi.challenger.id !== userId) {
      throw new ForbiddenException('Seul le createur du defi peut l annuler');
    }
    if (!['en_attente', 'accepte'].includes(defi.status)) {
      throw new BadRequestException('Ce defi ne peut plus etre annule');
    }

    defi.status = 'annule';
    defi.cancelledAt = new Date();
    return this.defisRepository.save(defi);
  }

  async refreshChallengesForUser(userId: string, anneeAcademiqueId?: string): Promise<Defi[]> {
    const where = [
      {
        challenger: { id: userId },
        status: 'accepte' as const,
      },
      {
        opponent: { id: userId },
        status: 'accepte' as const,
      },
    ];
    const defis = await this.defisRepository.find({ where });
    const filtered = anneeAcademiqueId ? defis.filter((defi) => defi.anneeAcademique.id === anneeAcademiqueId) : defis;
    const refreshed: Defi[] = [];
    for (const defi of filtered) {
      refreshed.push(await this.evaluateWinner(defi));
    }
    return refreshed;
  }

  private async evaluateWinner(defi: Defi): Promise<Defi> {
    if (defi.status !== 'accepte') {
      return defi;
    }

    const [challengerProgress, opponentProgress] = await Promise.all([
      this.getProgress(defi.challenger.id, defi.anneeAcademique.id),
      this.getProgress(defi.opponent.id, defi.anneeAcademique.id),
    ]);

    if (challengerProgress < 100 && opponentProgress < 100) {
      return defi;
    }

    defi.status = 'termine';
    defi.completedAt = new Date();
    defi.winner = challengerProgress >= 100 ? defi.challenger : defi.opponent;
    const savedDefi = await this.defisRepository.save(defi);
    const loser = savedDefi.winner.id === savedDefi.challenger.id ? savedDefi.opponent : savedDefi.challenger;

    await Promise.all([
      this.notificationsService.notifyChallengeCompleted(savedDefi.winner, savedDefi.winner, loser, {
        defiId: savedDefi.id,
        winnerId: savedDefi.winner.id,
        anneeAcademiqueId: savedDefi.anneeAcademique.id,
      }),
      this.notificationsService.notifyChallengeCompleted(loser, savedDefi.winner, savedDefi.winner, {
        defiId: savedDefi.id,
        winnerId: savedDefi.winner.id,
        anneeAcademiqueId: savedDefi.anneeAcademique.id,
      }),
    ]);

    return savedDefi;
  }

  private async withProgress(defi: Defi) {
    const [challengerProgress, opponentProgress] = await Promise.all([
      this.getProgress(defi.challenger.id, defi.anneeAcademique.id),
      this.getProgress(defi.opponent.id, defi.anneeAcademique.id),
    ]);
    return {
      ...defi,
      challengerProgress,
      opponentProgress,
    };
  }

  private async getProgress(userId: string, anneeAcademiqueId: string): Promise<number> {
    const cotisations = await this.cotisationsRepository.find({
      where: {
        user: { id: userId },
        anneeAcademique: { id: anneeAcademiqueId },
      },
    });
    const totalAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.amount, 0);
    const totalPaid = cotisations.reduce((sum, cotisation) => sum + Math.min(cotisation.paidAmount, cotisation.amount), 0);
    return totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;
  }

  private async ensureCotisationsExist(challengerId: string, opponentId: string, anneeAcademiqueId: string) {
    const cotisations = await this.cotisationsRepository.find({
      where: [
        { user: { id: challengerId }, anneeAcademique: { id: anneeAcademiqueId } },
        { user: { id: opponentId }, anneeAcademique: { id: anneeAcademiqueId } },
      ],
    });
    const userIds = new Set(cotisations.map((cotisation) => cotisation.user.id));
    if (!userIds.has(challengerId) || !userIds.has(opponentId)) {
      throw new BadRequestException('Les deux etudiants doivent avoir une cotisation active sur la meme annee');
    }
  }

  private ensureEligibleStudent(user: User) {
    if (!user.isActive || user.accountStatus !== 'actif' || user.role === 'alumni') {
      throw new BadRequestException('Cet utilisateur n est pas eligible aux defis de cotisation');
    }
  }

  private ensureParticipant(defi: Defi, userId: string) {
    if (defi.challenger.id !== userId && defi.opponent.id !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas consulter ce defi');
    }
  }

  private async findOne(id: string): Promise<Defi> {
    const defi = await this.defisRepository.findOne({ where: { id } });
    if (!defi) {
      throw new NotFoundException(`Defi avec id ${id} introuvable`);
    }
    return defi;
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

  private async findActiveYear(): Promise<AnneeAcademique> {
    const annee = await this.anneesRepository.findOne({ where: { active: true, statut: 'ouverte' } });
    if (!annee) {
      throw new NotFoundException('Aucune annee academique active et ouverte');
    }
    return annee;
  }
}
