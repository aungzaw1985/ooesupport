import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';

@Module({
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService], // Export so TicketsService can use it
})
export class SlaModule {}
