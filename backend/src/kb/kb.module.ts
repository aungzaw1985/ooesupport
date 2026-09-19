import { Module } from '@nestjs/common';
import { KbService } from './kb.service';
import { KbController } from './kb.controller';

@Module({
  controllers: [KbController],
  providers: [KbService],
  exports: [KbService],
})
export class KbModule {}
