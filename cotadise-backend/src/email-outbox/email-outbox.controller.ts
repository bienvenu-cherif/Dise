import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmailDispatcherService } from './email-dispatcher.service';
import { EmailOutboxService } from './email-outbox.service';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@Controller('emails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'tresorier')
export class EmailOutboxController {
  constructor(
    private readonly emailOutboxService: EmailOutboxService,
    private readonly emailDispatcherService: EmailDispatcherService,
  ) {}

  @Get('en-attente')
  findPending(@Query('limit') limit?: string) {
    return this.emailOutboxService.findPending(limit ? Number(limit) : 50);
  }

  @Get('statut')
  getStatus() {
    return this.emailDispatcherService.getStatus();
  }

  @Post('tester-connexion')
  verifyTransport() {
    return this.emailDispatcherService.verifyTransport();
  }

  @Post('envoyer-test')
  sendTestEmail(@Body() dto: SendTestEmailDto) {
    return this.emailDispatcherService.sendTestEmail(dto);
  }

  @Post('envoyer-en-attente')
  dispatchPending() {
    return this.emailDispatcherService.dispatchPending('api');
  }
}
