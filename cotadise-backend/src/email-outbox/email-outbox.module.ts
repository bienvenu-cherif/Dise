import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailDispatcherService } from './email-dispatcher.service';
import { EmailOutboxController } from './email-outbox.controller';
import { EmailMessage } from './email-message.entity';
import { EmailOutboxService } from './email-outbox.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([EmailMessage])],
  controllers: [EmailOutboxController],
  providers: [EmailOutboxService, EmailDispatcherService],
  exports: [EmailOutboxService, EmailDispatcherService],
})
export class EmailOutboxModule {}
