import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { SendPromotionMessageDto } from './dto/send-promotion-message.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: [
        { role: 'alumni', isActive: true },
        { accountStatus: 'alumni', isActive: true },
      ],
      order: { promotionSortante: 'DESC', lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findPromotions() {
    const alumni = await this.findAll();
    const promotions = new Map<string, { promotion: string; totalAlumni: number; alumni: User[] }>();

    for (const user of alumni) {
      const promotion = user.promotionSortante ?? 'promotion_non_renseignee';
      const entry = promotions.get(promotion) ?? { promotion, totalAlumni: 0, alumni: [] };
      entry.totalAlumni += 1;
      entry.alumni.push(user);
      promotions.set(promotion, entry);
    }

    return Array.from(promotions.values()).sort((a, b) => b.promotion.localeCompare(a.promotion));
  }

  async findPromotion(promotion: string) {
    const alumni = await this.usersRepository.find({
      where: [
        { role: 'alumni', promotionSortante: promotion, isActive: true },
        { accountStatus: 'alumni', promotionSortante: promotion, isActive: true },
      ],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    return {
      promotion,
      totalAlumni: alumni.length,
      alumni,
    };
  }

  sendPromotionMessage(senderId: string, promotion: string, dto: SendPromotionMessageDto) {
    return this.notificationsService.sendManual(senderId, {
      promotionSortante: promotion,
      type: 'demande_aide_alumni',
      canal: dto.canal ?? 'application_et_email',
      title: dto.title,
      message: dto.message,
    });
  }
}
