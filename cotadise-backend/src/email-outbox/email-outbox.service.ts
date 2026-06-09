import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/notification.entity';
import { EmailMessage } from './email-message.entity';

@Injectable()
export class EmailOutboxService {
  constructor(
    @InjectRepository(EmailMessage)
    private readonly emailMessagesRepository: Repository<EmailMessage>,
  ) {}

  async queueNotificationEmail(notification: Notification): Promise<EmailMessage | null> {
    if (!notification.recipient?.email) {
      return null;
    }

    const recipientName = [notification.recipient.firstName, notification.recipient.lastName].filter(Boolean).join(' ');
    const email = this.emailMessagesRepository.create({
      notification,
      recipient: notification.recipient,
      recipientEmail: notification.recipient.email,
      recipientName,
      subject: notification.title,
      body: notification.message,
      status: 'en_attente',
    });

    return this.emailMessagesRepository.save(email);
  }

  findPending(limit = 50): Promise<EmailMessage[]> {
    return this.emailMessagesRepository.find({
      where: { status: 'en_attente' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }
}
