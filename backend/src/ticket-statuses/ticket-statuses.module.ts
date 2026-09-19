import { Module } from '@nestjs/common';
import { TicketStatusesService } from './ticket-statuses.service';
import { TicketStatusesController } from './ticket-statuses.controller';

@Module({
  controllers: [TicketStatusesController],
  providers: [TicketStatusesService],
  exports: [TicketStatusesService],
})
export class TicketStatusesModule {}
