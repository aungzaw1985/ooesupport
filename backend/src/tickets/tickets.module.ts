import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsGateway } from './tickets.gateway';
import { SlaModule } from '../sla/sla.module';
import { TicketNumberService } from './ticket-number.service'; // <-- Add
import { AutomationService } from '../automation/automation.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [SlaModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway, TicketNumberService, AutomationService, NotificationsService], // <-- Add
  exports: [TicketsService],
})
export class TicketsModule {}