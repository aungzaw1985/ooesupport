import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketNumberService {
  constructor(private prisma: PrismaService) {}

  async generateTicketNumber(prefix?: string, seqType?: string): Promise<string> {
    const actualPrefix = (prefix || 'TCK').toUpperCase();
    const actualSeqType = (seqType || 'SEQUENTIAL').toUpperCase();

    if (actualSeqType === 'RANDOM') {
      // Generate a random 6-digit number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      return `${actualPrefix}${randomNum}`;
    } else {
      // SEQUENTIAL: Use a transaction to safely increment the counter
      const sequence = await this.prisma.$transaction(async (tx) => {
        // Upsert creates the sequence if it doesn't exist, or increments it if it does
        return tx.sequence.upsert({
          where: { prefix: actualPrefix },
          update: { count: { increment: 1 } },
          create: { prefix: actualPrefix, count: 1 },
        });
      });

      // Pad the number with leading zeros (e.g., 1 -> 000001)
      const paddedCount = String(sequence.count).padStart(6, '0');
      return `${actualPrefix}${paddedCount}`;
    }
  }
}
