import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailMessage } from './email-message.entity';
import { EmailOutboxService } from './email-outbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailMessage])],
  providers: [EmailOutboxService],
  exports: [EmailOutboxService],
})
export class EmailOutboxModule {}
