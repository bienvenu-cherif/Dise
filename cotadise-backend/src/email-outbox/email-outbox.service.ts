import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/notification.entity';
import { User } from '../users/user.entity';
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

  async queueRawEmail(input: {
    recipient?: User;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
  }): Promise<EmailMessage> {
    const email = this.emailMessagesRepository.create({
      recipient: input.recipient,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      subject: input.subject,
      body: input.body,
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

  async markSent(email: EmailMessage): Promise<EmailMessage> {
    email.status = 'envoye';
    email.sentAt = new Date();
    email.lastError = undefined;
    if (email.notification) {
      email.notification.emailSent = true;
      email.notification.emailSentAt = email.sentAt;
    }
    return this.emailMessagesRepository.save(email);
  }

  async markFailed(email: EmailMessage, error: unknown, maxAttempts = 3): Promise<EmailMessage> {
    email.attempts += 1;
    email.lastError = error instanceof Error ? error.message : String(error);
    email.status = email.attempts >= maxAttempts ? 'echec' : 'en_attente';
    return this.emailMessagesRepository.save(email);
  }
}
