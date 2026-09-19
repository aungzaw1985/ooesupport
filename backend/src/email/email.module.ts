import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { TicketsModule } from '../tickets/tickets.module';
import { EmailSettingsModule } from '../email-settings/email-settings.module';

@Global()
@Module({
  imports: [TicketsModule, EmailSettingsModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService], // <-- Ensure it's exported
})
export class EmailModule {}