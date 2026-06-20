import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rowsToXlsxBuffer } from '../common/excel.helper';
import { Cotisation } from '../cotisations/cotisation.entity';
import { Paiement } from '../paiements/paiement.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(Paiement)
    private readonly paiementsRepository: Repository<Paiement>,
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
  ) {}

  async getSummary(anneeAcademiqueId?: string) {
    const [cotisations, paiements] = await Promise.all([
      this.findCotisationsForYear(anneeAcademiqueId),
      this.findPaiementsForYear(anneeAcademiqueId),
    ]);

    const totalCotisations = cotisations.length;
    const totalAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.amount, 0);
    const totalPaidAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.paidAmount, 0);
    const totalRemainingAmount = cotisations.reduce((sum, cotisation) => sum + Math.max(0, cotisation.amount - cotisation.paidAmount), 0);
    const totalPaid = cotisations.filter((cotisation) => cotisation.paid).length;
    const totalPartial = cotisations.filter((cotisation) => cotisation.status === 'partial').length;
    const totalPending = cotisations.filter((cotisation) => cotisation.status === 'pending').length;
    const totalPayments = paiements.length;
    const totalPaymentAmount = paiements.reduce((sum, paiement) => sum + paiement.amount, 0);
    const totalOverdue = cotisations.filter((cotisation) => {
      const dueDate = new Date(cotisation.dueDate);
      return !cotisation.paid && dueDate < new Date();
    }).length;
    const totalOverdueAmount = cotisations
      .filter((cotisation) => {
        const dueDate = new Date(cotisation.dueDate);
        return !cotisation.paid && dueDate < new Date();
      })
      .reduce((sum, cotisation) => sum + Math.max(0, cotisation.amount - cotisation.paidAmount), 0);

    return {
      totalCotisations,
      totalAmount,
      totalPaidAmount,
      totalRemainingAmount,
      totalPaid,
      totalPartial,
      totalPending,
      totalOverdue,
      totalOverdueAmount,
      totalPayments,
      totalPaymentAmount,
    };
  }

  async getStudentSummary(userId: string, anneeAcademiqueId?: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const [cotisations, paiements] = await Promise.all([
      this.findCotisationsForYear(anneeAcademiqueId, userId),
      this.findPaiementsForYear(anneeAcademiqueId, userId),
    ]);

    const totalAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.amount, 0);
    const totalPaidAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.paidAmount, 0);
    const totalRemainingAmount = cotisations.reduce((sum, cotisation) => sum + Math.max(0, cotisation.amount - cotisation.paidAmount), 0);
    const levelAmount = totalAmount || user.level?.annualAmount || 0;
    const progress = levelAmount > 0 ? Math.min(100, Math.round((totalPaidAmount / levelAmount) * 100)) : 0;
    const lastPayment = paiements.length ? paiements[0].paidAt : null;

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      level: user.level
        ? {
            id: user.level.id,
            name: user.level.name,
            annualAmount: user.level.annualAmount,
          }
        : null,
      totalAmount,
      totalPaidAmount,
      totalRemainingAmount,
      progress,
      lastPayment,
      cotisations,
      payments: paiements,
    };
  }

  async getStudentProgression(userId: string, anneeAcademiqueId?: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: { level: true } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const [cotisations, paiements] = await Promise.all([
      this.findCotisationsForYear(anneeAcademiqueId, userId),
      this.findPaiementsForYear(anneeAcademiqueId, userId),
    ]);
    const confirmedPayments = paiements
      .filter((paiement) => paiement.status === 'confirme')
      .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime());
    const totalAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.amount, 0);
    const totalPaidAmount = cotisations.reduce((sum, cotisation) => sum + cotisation.paidAmount, 0);
    const totalRemainingAmount = Math.max(0, totalAmount - totalPaidAmount);

    let cumulativePaidAmount = 0;
    const points = confirmedPayments.map((paiement) => {
      cumulativePaidAmount += paiement.amount;
      const cappedPaidAmount = Math.min(cumulativePaidAmount, totalAmount);
      return {
        paymentId: paiement.id,
        paidAt: paiement.paidAt,
        amount: paiement.amount,
        method: paiement.method,
        origin: paiement.origin,
        reference: paiement.reference,
        cumulativePaidAmount: cappedPaidAmount,
        remainingAmount: Math.max(0, totalAmount - cappedPaidAmount),
        progress: totalAmount > 0 ? Math.min(100, Math.round((cappedPaidAmount / totalAmount) * 100)) : 0,
      };
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      level: user.level ? { id: user.level.id, name: user.level.name } : null,
      anneeAcademiqueId: anneeAcademiqueId ?? null,
      totalAmount,
      totalPaidAmount,
      totalRemainingAmount,
      progress: totalAmount > 0 ? Math.min(100, Math.round((totalPaidAmount / totalAmount) * 100)) : 0,
      points,
    };
  }

  async getRankings(levelId?: string, anneeAcademiqueId?: string) {
    const cotisations = await this.findCotisationsForYear(anneeAcademiqueId);

    const grouped = new Map<string, { paidAmount: number; targetAmount: number; user: User }>();
    for (const cotisation of cotisations) {
      let entry = grouped.get(cotisation.user.id);
      if (!entry) {
        entry = {
          paidAmount: 0,
          targetAmount: 0,
          user: cotisation.user,
        };
        grouped.set(cotisation.user.id, entry);
      }
      entry.paidAmount += cotisation.paidAmount;
      entry.targetAmount += cotisation.amount;
    }

    const rows = Array.from(grouped.values())
      .filter((entry) => {
        if (!levelId) {
          return true;
        }
        return entry.user.level?.id === levelId;
      })
      .map((entry) => {
        const progress = entry.targetAmount > 0 ? Math.min(100, Math.round((entry.paidAmount / entry.targetAmount) * 100)) : 0;
        return {
          userId: entry.user.id,
          firstName: entry.user.firstName,
          lastName: entry.user.lastName,
          email: entry.user.email,
          level: entry.user.level ? { id: entry.user.level.id, name: entry.user.level.name } : null,
          paidAmount: entry.paidAmount,
          expectedAmount: entry.targetAmount,
          progress,
        };
      })
      .sort((a, b) => b.progress - a.progress || b.paidAmount - a.paidAmount);

    return rows;
  }

  async getOverdueCotisations(levelId?: string, anneeAcademiqueId?: string) {
    const today = new Date();
    const cotisations = await this.findCotisationsForYear(anneeAcademiqueId);

    return cotisations
      .filter((cotisation) => {
        const dueDate = new Date(cotisation.dueDate);
        const isOverdue = !cotisation.paid && dueDate < today;
        if (!isOverdue) {
          return false;
        }
        if (!levelId) {
          return true;
        }
        return cotisation.user.level?.id === levelId;
      })
      .map((cotisation) => ({
        id: cotisation.id,
        title: cotisation.title,
        amount: cotisation.amount,
        paidAmount: cotisation.paidAmount,
        remainingAmount: Math.max(0, cotisation.amount - cotisation.paidAmount),
        dueDate: cotisation.dueDate,
        anneeAcademique: cotisation.anneeAcademique
          ? { id: cotisation.anneeAcademique.id, libelle: cotisation.anneeAcademique.libelle }
          : null,
        user: {
          id: cotisation.user.id,
          firstName: cotisation.user.firstName,
          lastName: cotisation.user.lastName,
          email: cotisation.user.email,
        },
        level: cotisation.user.level
          ? { id: cotisation.user.level.id, name: cotisation.user.level.name }
          : null,
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async generateOverdueExport(levelId?: string, anneeAcademiqueId?: string): Promise<Buffer> {
    const overdue = await this.getOverdueCotisations(levelId, anneeAcademiqueId);
    return rowsToXlsxBuffer(overdue.map((item) => ({
      'Cotisation ID': item.id,
      Title: item.title,
      Amount: item.amount,
      'Paid Amount': item.paidAmount,
      'Remaining Amount': item.remainingAmount,
      'Due Date': item.dueDate,
      'Academic Year': item.anneeAcademique?.libelle || '',
      'Student ID': item.user.id,
      'Student First Name': item.user.firstName,
      'Student Last Name': item.user.lastName,
      'Student Email': item.user.email,
      'Level ID': item.level?.id || '',
      'Level Name': item.level?.name || '',
    })), 'Overdue');
  }

  async getLevelSummaries(anneeAcademiqueId?: string) {
    const [levels, cotisations] = await Promise.all([
      this.levelsRepository.find({ relations: { users: true } }),
      this.findCotisationsForYear(anneeAcademiqueId),
    ]);

    return levels.map((level) => {
      const levelCotisations = cotisations.filter((cotisation) => cotisation.user.level?.id === level.id);
      const paidAmount = levelCotisations.reduce((sum, cotisation) => sum + cotisation.paidAmount, 0);
      const expectedAmount = levelCotisations.reduce((sum, cotisation) => sum + cotisation.amount, 0);
      const studentsCount = new Set(levelCotisations.map((cotisation) => cotisation.user.id)).size;
      const overdueCotisations = levelCotisations.filter((cotisation) => {
        const dueDate = new Date(cotisation.dueDate);
        return !cotisation.paid && dueDate < new Date();
      });
      const overdueAmount = overdueCotisations.reduce((sum, cotisation) => sum + Math.max(0, cotisation.amount - cotisation.paidAmount), 0);
      const progress = expectedAmount > 0 ? Math.min(100, Math.round((paidAmount / expectedAmount) * 100)) : 0;

      return {
        levelId: level.id,
        name: level.name,
        description: level.description,
        annualAmount: level.annualAmount,
        studentsCount,
        paidAmount,
        expectedAmount,
        remainingAmount: Math.max(0, expectedAmount - paidAmount),
        overdueCount: overdueCotisations.length,
        overdueAmount,
        progress,
      };
    });
  }

  async getLevelSummary(levelId: string, anneeAcademiqueId?: string) {
    const summaries = await this.getLevelSummaries(anneeAcademiqueId);
    const summary = summaries.find((entry) => entry.levelId === levelId);
    if (!summary) {
      throw new NotFoundException(`Academic level with id ${levelId} not found`);
    }
    return summary;
  }

  async getUserRanking(userId: string, anneeAcademiqueId?: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: { level: true } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const levelId = user.level?.id;
    const rankings = await this.getRankings(levelId, anneeAcademiqueId);
    const position = rankings.findIndex((entry) => entry.userId === userId);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      level: user.level
        ? {
            id: user.level.id,
            name: user.level.name,
            annualAmount: user.level.annualAmount,
          }
        : null,
      rank: position >= 0 ? position + 1 : null,
      totalInLevel: rankings.length,
      rankings,
    };
  }

  private findCotisationsForYear(anneeAcademiqueId?: string, userId?: string): Promise<Cotisation[]> {
    const query = this.cotisationsRepository
      .createQueryBuilder('cotisation')
      .leftJoinAndSelect('cotisation.user', 'user')
      .leftJoinAndSelect('user.level', 'level')
      .leftJoinAndSelect('cotisation.anneeAcademique', 'anneeAcademique')
      .orderBy('cotisation.dueDate', 'DESC');

    if (anneeAcademiqueId) {
      query.andWhere('anneeAcademique.id = :anneeAcademiqueId', { anneeAcademiqueId });
    }
    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    return query.getMany();
  }

  private findPaiementsForYear(anneeAcademiqueId?: string, userId?: string): Promise<Paiement[]> {
    const query = this.paiementsRepository
      .createQueryBuilder('paiement')
      .leftJoinAndSelect('paiement.user', 'user')
      .leftJoinAndSelect('paiement.cotisation', 'cotisation')
      .leftJoinAndSelect('cotisation.anneeAcademique', 'anneeAcademique')
      .orderBy('paiement.paidAt', 'DESC');

    if (anneeAcademiqueId) {
      query.andWhere('anneeAcademique.id = :anneeAcademiqueId', { anneeAcademiqueId });
    }
    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    return query.getMany();
  }
}
