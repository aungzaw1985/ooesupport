import { Module } from '@nestjs/common';
import { EmailSettingsService } from './email-settings.service';
import { EmailSettingsController } from './email-settings.controller';
import { EmailTemplatesController } from './email-templates.controller';

@Module({
  controllers: [EmailSettingsController, EmailTemplatesController],
  providers: [EmailSettingsService],
  exports: [EmailSettingsService],
})
export class EmailSettingsModule {}
