import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsSchedulerService.name);
  private reminderInterval?: ReturnType<typeof setInterval>;

  constructor(private readonly notificationsService: NotificationsService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test' || process.env.COTADISE_DISABLE_AUTO_REMINDERS === 'true') {
      return;
    }

    this.reminderInterval = setInterval(() => {
      void this.runReminderCheck('interval');
    }, 24 * 60 * 60 * 1000);

    setTimeout(() => {
      void this.runReminderCheck('startup');
    }, 30 * 1000);
  }

  onModuleDestroy() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
  }

  async runReminderCheck(source = 'manual') {
    try {
      const result = await this.notificationsService.generateAutomaticRemindersForActiveYear(21);
      this.logger.log(
        `Verification rappels cotisation (${source}) terminee: ${result.sentCount} notification(s) envoyee(s)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Echec verification rappels cotisation (${source})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
