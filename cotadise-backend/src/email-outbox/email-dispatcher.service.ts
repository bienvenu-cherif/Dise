import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { EmailMessage } from './email-message.entity';
import { EmailOutboxService } from './email-outbox.service';

@Injectable()
export class EmailDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailDispatcherService.name);
  private interval?: ReturnType<typeof setInterval>;
  private transporter?: Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailOutboxService: EmailOutboxService,
  ) {}

  onModuleInit() {
    if (!this.isEnabled()) {
      this.logger.log('Envoi email desactive. Les emails restent dans la file email_messages.');
      return;
    }

    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });

    this.interval = setInterval(() => {
      void this.dispatchPending('interval');
    }, Number(this.configService.get<string>('EMAIL_DISPATCH_INTERVAL_MS', '60000')));

    setTimeout(() => {
      void this.dispatchPending('startup');
    }, 10_000);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async dispatchPending(source = 'manual') {
    if (!this.transporter) {
      return { skipped: true, reason: 'Transport SMTP non configure', sentCount: 0, failedCount: 0 };
    }

    const limit = Number(this.configService.get<string>('EMAIL_DISPATCH_BATCH_SIZE', '25'));
    const pendingEmails = await this.emailOutboxService.findPending(limit);
    let sentCount = 0;
    let failedCount = 0;

    for (const email of pendingEmails) {
      try {
        await this.sendEmail(email);
        await this.emailOutboxService.markSent(email);
        sentCount += 1;
      } catch (error) {
        await this.emailOutboxService.markFailed(email, error);
        failedCount += 1;
        this.logger.warn(`Email ${email.id} non envoye: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (sentCount || failedCount) {
      this.logger.log(`Expedition email (${source}): ${sentCount} envoye(s), ${failedCount} echec(s)`);
    }

    return { skipped: false, sentCount, failedCount };
  }

  getStatus() {
    const enabled = this.configService.get<string>('EMAIL_DISPATCH_ENABLED', 'false') === 'true';
    const configured =
      Boolean(this.configService.get<string>('SMTP_HOST')) &&
      Boolean(this.configService.get<string>('SMTP_USER')) &&
      Boolean(this.configService.get<string>('SMTP_PASSWORD')) &&
      Boolean(this.configService.get<string>('SMTP_FROM'));
    return {
      enabled,
      configured,
      ready: Boolean(this.transporter),
      host: this.configService.get<string>('SMTP_HOST') || null,
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      from: this.configService.get<string>('SMTP_FROM') || null,
      intervalMs: Number(this.configService.get<string>('EMAIL_DISPATCH_INTERVAL_MS', '60000')),
      batchSize: Number(this.configService.get<string>('EMAIL_DISPATCH_BATCH_SIZE', '25')),
    };
  }

  async verifyTransport() {
    if (!this.transporter) {
      return {
        success: false,
        skipped: true,
        reason: 'Transport SMTP non configure ou envoi desactive',
      };
    }
    await this.transporter.verify();
    return { success: true, skipped: false };
  }

  async sendTestEmail(input: { recipientEmail: string; recipientName?: string }) {
    if (!this.transporter) {
      return {
        success: false,
        skipped: true,
        reason: 'Transport SMTP non configure ou envoi desactive',
      };
    }

    const recipient = input.recipientName
      ? `"${input.recipientName}" <${input.recipientEmail}>`
      : input.recipientEmail;
    const from = this.configService.get<string>('SMTP_FROM') ?? this.configService.get<string>('SMTP_USER');

    await this.transporter.sendMail({
      from,
      to: recipient,
      subject: 'Test SMTP CotaDISE',
      text: [
        'Bonjour,',
        '',
        'Ceci est un email de test envoye depuis CotaDISE.',
        'Si vous recevez ce message, la configuration SMTP est operationnelle.',
        '',
        `Date du test: ${new Date().toISOString()}`,
      ].join('\n'),
    });

    return { success: true, skipped: false };
  }

  private async sendEmail(email: EmailMessage) {
    const from = this.configService.get<string>('SMTP_FROM') ?? this.configService.get<string>('SMTP_USER');
    await this.transporter!.sendMail({
      from,
      to: email.recipientName ? `"${email.recipientName}" <${email.recipientEmail}>` : email.recipientEmail,
      subject: email.subject,
      text: email.body,
    });
  }

  private isEnabled() {
    return (
      this.configService.get<string>('EMAIL_DISPATCH_ENABLED', 'false') === 'true' &&
      Boolean(this.configService.get<string>('SMTP_HOST')) &&
      Boolean(this.configService.get<string>('SMTP_USER')) &&
      Boolean(this.configService.get<string>('SMTP_PASSWORD'))
    );
  }
}
