import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async saveAttachment(file: Express.Multer.File, threadEntryId: number) {
    // Save file metadata to the database
    return this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        url: `/uploads/${file.filename}`,
        threadEntryId: threadEntryId,
      },
    });
  }
}
