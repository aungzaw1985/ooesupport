import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailSettingsService } from '../email-settings/email-settings.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private fromAddress: string = '"Support Team" <support@ticket-platform.com>';
  private readonly logger = new Logger(EmailService.name);

  constructor(
     private prisma: PrismaService,
     private emailSettingsService: EmailSettingsService
  ) {}

  async onModuleInit() {
    await this.configureTransporter();
  }

  // Reconfigure transporter if admin updates SMTP settings
  async configureTransporter() {
    const settings = await this.emailSettingsService.getDecryptedSettings();

    if (settings && settings.smtpHost && settings.smtpUser) {
      const port = settings.smtpPort || 587;
      const encryption = settings.encryption || 'STARTTLS';

      this.transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: port,
        secure: encryption === 'SSL' || port === 465,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
        requireTLS: encryption === 'STARTTLS',
      });
      
      // --- SET THE FROM ADDRESS DYNAMICALLY ---
      this.fromAddress = `"Support Team" <${settings.smtpUser}>`;
      
      this.logger.log(`Custom SMTP transport configured (${encryption} on port ${port}).`);
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.fromAddress = `"Support Team" <${testAccount.user}>`; // Use test account for Ethereal
      this.logger.warn('No SMTP settings found. Using Ethereal Email.');
    }
  }

  private async renderTemplate(type: string, variables: Record<string, string>) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { type } });
    
    let subject = template ? template.subject : `Ticket Update: ${variables.ticketNumber || ''}`;
    let body = template ? template.body : `{{message}}`;

    // Replace variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return { subject, body };
  }

  private formatEmailHtml(subject: string, body: string): string {
    // Convert literal \n and actual newlines to HTML line breaks
    const htmlBody = body.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
    
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Support Team</h1>
        </div>
        <div style="padding: 30px; color: #374151; line-height: 1.6; font-size: 14px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 18px;">${subject}</h2>
          <div>${htmlBody}</div>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; ${new Date().getFullYear()} Support Team. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  async sendDynamicEmail(to: string, type: string, variables: Record<string, string>) {
    try {
      const template = await this.prisma.emailTemplate.findUnique({ where: { type } });

      if (!template || !template.isEnabled) {
        this.logger.log(`Email type ${type} is disabled or not found. Skipping.`);
        return;
      }

      let subject = template.subject;
      let body = template.body;

      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, variables[key]);
        body = body.replace(regex, variables[key]);
      });

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: to,
        subject: subject,
        text: body.replace(/\\n/g, '\n'), // Plain text version for email clients that don't support HTML
        html: this.formatEmailHtml(subject, body), // Beautiful HTML version
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Email sent to ${to}. Preview: ${previewUrl}`);
      } else {
        this.logger.log(`Email sent successfully to ${to}`);
      }
    } catch (error) {
      this.logger.error('Failed to send email', error);
    }
  }
}