import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttachmentsService } from './attachments.service';

@Controller('api/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload/:threadEntryId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Save to the uploads folder we created
        filename: (req, file, cb) => {
          // Generate a unique filename to avoid collisions
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|plain|x-log)$/)) {
          return cb(new BadRequestException('Only image, PDF, text, and log files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('threadEntryId', ParseIntPipe) threadEntryId: number,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.attachmentsService.saveAttachment(file, threadEntryId);
  }
}
