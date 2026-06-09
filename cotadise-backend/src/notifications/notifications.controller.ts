import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateManualNotificationDto } from './dto/create-manual-notification.dto';
import { GenerateRemindersDto } from './dto/generate-reminders.dto';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsSchedulerService: NotificationsSchedulerService,
  ) {}

  @Get('me')
  findMine(@Req() req: any) {
    return this.notificationsService.findForUser(req.user.id);
  }

  @Patch(':id/lire')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('manuel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  sendManual(@Req() req: any, @Body() dto: CreateManualNotificationDto) {
    return this.notificationsService.sendManual(req.user.id, dto);
  }

  @Post('rappels-cotisation')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  generateContributionReminders(@Body() dto: GenerateRemindersDto) {
    return this.notificationsService.generateContributionReminders(dto);
  }

  @Post('rappels-cotisation/annee-active')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  generateActiveYearContributionReminders() {
    return this.notificationsSchedulerService.runReminderCheck('api');
  }
}
