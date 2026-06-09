import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { EmailOutboxService } from '../email-outbox/email-outbox.service';
import { Paiement } from '../paiements/paiement.entity';
import { User } from '../users/user.entity';
import { CreateManualNotificationDto } from './dto/create-manual-notification.dto';
import { GenerateRemindersDto } from './dto/generate-reminders.dto';
import { CanalNotification, Notification, TypeNotification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(Paiement)
    private readonly paiementsRepository: Repository<Paiement>,
    private readonly emailOutboxService: EmailOutboxService,
  ) {}

  findForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, recipient: { id: userId } },
    });
    if (!notification) {
      throw new NotFoundException(`Notification avec id ${id} introuvable`);
    }
    notification.read = true;
    notification.readAt = new Date();
    return this.notificationsRepository.save(notification);
  }

  async sendManual(senderId: string, dto: CreateManualNotificationDto) {
    const sender = await this.findUser(senderId);
    const anneeAcademique = dto.anneeAcademiqueId ? await this.findAnnee(dto.anneeAcademiqueId) : undefined;
    const type = dto.type ?? (dto.promotionSortante ? 'demande_aide_alumni' : 'message_manuel');
    const canal = dto.canal ?? 'application_et_email';

    if (dto.recipientId) {
      const recipient = await this.findUser(dto.recipientId);
      return this.createNotification({
        recipient,
        sender,
        anneeAcademique,
        type,
        canal,
        title: dto.title,
        message: dto.message,
      });
    }

    if (dto.promotionSortante) {
      const recipients = await this.usersRepository.find({
        where: {
          role: 'alumni',
          promotionSortante: dto.promotionSortante,
          isActive: true,
        },
      });
      const notifications: Notification[] = [];
      for (const recipient of recipients) {
        notifications.push(
          await this.createNotification({
            recipient,
            sender,
            anneeAcademique,
            type: 'demande_aide_alumni',
            canal,
            title: dto.title,
            message: dto.message,
            promotionSortante: dto.promotionSortante,
          }),
        );
      }
      return {
        promotionSortante: dto.promotionSortante,
        sentCount: notifications.length,
        notifications,
      };
    }

    throw new BadRequestException('Veuillez choisir un destinataire ou une promotion sortante');
  }

  async generateContributionReminders(dto: GenerateRemindersDto) {
    const anneeAcademique = await this.findAnnee(dto.anneeAcademiqueId);
    return this.generateContributionRemindersForYear(anneeAcademique, dto.inactiveDays ?? 21);
  }

  async generateAutomaticRemindersForActiveYear(inactiveDays = 21) {
    const anneeAcademique = await this.anneesRepository.findOne({
      where: {
        active: true,
        statut: 'ouverte',
      },
    });

    if (!anneeAcademique) {
      return {
        skipped: true,
        reason: 'Aucune annee academique active et ouverte',
        inactiveDays,
        sentCount: 0,
        notifications: [],
      };
    }

    return this.generateContributionRemindersForYear(anneeAcademique, inactiveDays);
  }

  private async generateContributionRemindersForYear(anneeAcademique: AnneeAcademique, inactiveDays: number) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - inactiveDays);

    const cotisations = await this.cotisationsRepository.find({
      where: {
        anneeAcademique: { id: anneeAcademique.id },
        paid: false,
      },
      relations: { user: true },
    });
    const notifications: Notification[] = [];

    for (const cotisation of cotisations) {
      const remainingAmount = Math.max(0, cotisation.amount - cotisation.paidAmount);
      if (remainingAmount <= 0 || cotisation.status === 'paid') {
        continue;
      }

      if (cotisation.createdAt && new Date(cotisation.createdAt) > limitDate) {
        continue;
      }

      const recentPayment = await this.paiementsRepository.findOne({
        where: {
          user: { id: cotisation.user.id },
          cotisation: { id: cotisation.id },
          status: 'confirme',
          paidAt: LessThan(new Date()),
        },
        order: { paidAt: 'DESC' },
      });
      if (recentPayment && new Date(recentPayment.paidAt) > limitDate) {
        continue;
      }

      const recentReminder = await this.notificationsRepository.findOne({
        where: {
          recipient: { id: cotisation.user.id },
          anneeAcademique: { id: anneeAcademique.id },
          type: 'rappel_cotisation',
        },
        order: { createdAt: 'DESC' },
      });
      if (recentReminder && new Date(recentReminder.createdAt) > limitDate) {
        continue;
      }

      notifications.push(
        await this.createNotification({
          recipient: cotisation.user,
          anneeAcademique,
          type: 'rappel_cotisation',
          canal: 'application_et_email',
          title: 'On compte sur toi',
          message:
            'Ta cotisation n a pas ete alimentee recemment. Meme une petite contribution aide la division a avancer.',
          metadata: {
            cotisationId: cotisation.id,
            remainingAmount,
          },
        }),
      );
    }

    return {
      anneeAcademique: {
        id: anneeAcademique.id,
        libelle: anneeAcademique.libelle,
      },
      inactiveDays,
      sentCount: notifications.length,
      notifications,
    };
  }

  async notifyPaymentConfirmed(paiement: Paiement): Promise<Notification> {
    const title = paiement.origin === 'paiement_pour_camarade' ? 'Un camarade a cotise pour toi' : 'Paiement confirme';
    const message =
      paiement.origin === 'paiement_pour_camarade'
        ? `${paiement.payer?.firstName ?? 'Un camarade'} a paye ${paiement.amount} pour ta cotisation.`
        : `Nous avons bien reçu ton paiement de ${paiement.amount}. Felicitations pour ta contribution.`;

    return this.createNotification({
      recipient: paiement.user,
      type: paiement.origin === 'paiement_pour_camarade' ? 'paiement_pour_toi' : 'paiement_confirme',
      canal: 'application_et_email',
      title,
      message,
      anneeAcademique: paiement.cotisation?.anneeAcademique,
      metadata: {
        paiementId: paiement.id,
        cotisationId: paiement.cotisation?.id,
        amount: paiement.amount,
        origin: paiement.origin,
      },
    });
  }

  async notifyChallengeReceived(recipient: User, sender: User, metadata?: Record<string, unknown>): Promise<Notification> {
    return this.createNotification({
      recipient,
      sender,
      type: 'defi_recu',
      canal: 'application',
      title: 'Nouveau defi reçu',
      message: `${sender.firstName} ${sender.lastName} te lance un defi de cotisation.`,
      metadata,
    });
  }

  async notifyChallengeCompleted(
    recipient: User,
    winner: User,
    opponent: User,
    metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    const isWinner = recipient.id === winner.id;
    return this.createNotification({
      recipient,
      sender: opponent,
      type: 'defi_termine',
      canal: 'application',
      title: isWinner ? 'Defi gagne' : 'Defi termine',
      message: isWinner
        ? `Bravo ${recipient.firstName}, tu as gagne ton defi de cotisation.`
        : `${winner.firstName} ${winner.lastName} a termine sa cotisation avant toi.`,
      metadata,
    });
  }

  private async createNotification(params: {
    recipient?: User;
    sender?: User;
    anneeAcademique?: AnneeAcademique;
    type: TypeNotification;
    canal: CanalNotification;
    title: string;
    message: string;
    promotionSortante?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...params,
      emailSent: false,
    });
    const savedNotification = await this.notificationsRepository.save(notification);

    if (savedNotification.canal === 'email' || savedNotification.canal === 'application_et_email') {
      await this.emailOutboxService.queueNotificationEmail(savedNotification);
    }

    return savedNotification;
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
}
