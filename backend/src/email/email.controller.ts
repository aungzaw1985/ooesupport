import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';
import { TicketsService } from '../tickets/tickets.service';
import { InboundEmailDto } from './dto/inbound-email.dto';

@Controller('api/email')
export class EmailController {
  constructor(
    private readonly ticketsService: TicketsService,
  ) {}

  // This endpoint is hit by Mailgun/SendGrid when a user replies to an email
  @Post('inbound')
  async handleInboundEmail(@Body() dto: InboundEmailDto) {
    return this.ticketsService.addEmailReplyToThread(dto);
  }
}
