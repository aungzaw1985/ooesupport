import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailSettingsService implements OnModuleInit {
  private algorithm = 'aes-256-cbc';
  private key = process.env.ENCRYPTION_KEY || 'default_fallback_key_change_me!!';
  private iv = crypto.randomBytes(16);

  constructor(private prisma: PrismaService) {}

  // --- AUTO-SEED DEFAULT TEMPLATES ON STARTUP ---
  async onModuleInit() {
    await this.seedDefaultTemplates();
  }

  private async seedDefaultTemplates() {
    const defaults = [
      { type: 'USER_REGISTERED', subject: 'Welcome to the Support Portal!', body: 'Hello {{name}},\n\nThank you for registering with our support portal. Your account has been successfully created.\n\nYou can now log in using your email address to submit and track your support requests.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'ACCOUNT_ACTIVATION', subject: 'Account Activated - Welcome to the Support Portal', body: 'Hello {{name}},\n\nYour support portal account has been activated. You now have full access to our ticketing system.\n\nIf you have any questions, please don\'t hesitate to reach out to our support team.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'STAFF_CREATED', subject: 'Welcome to the Support Team!', body: 'Hello {{name}},\n\nAn administrator has created a staff account for you on our support portal.\n\nYou can log in using your email address and the password provided to you. For security reasons, please change your password immediately upon your first login.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'PASSWORD_RESET', subject: 'Action Required: Reset Your Password', body: 'Hello,\n\nWe received a request to reset the password for your support portal account.\n\nClick the link below to choose a new password:\n{{resetLink}}\n\nThis link will expire in 1 hour. If you did not request this change, you can safely ignore this email and your password will remain unchanged.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'TICKET_CREATED', subject: 'Ticket Received: [{{ticketNumber}}] {{subject}}', body: 'Hello,\n\nThank you for contacting our support team. We have received your ticket regarding "{{subject}}".\n\nTicket Number: {{ticketNumber}}\n\nOur team is currently reviewing your request and will get back to you as soon as possible. You can track the progress of your ticket by logging into the portal.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'TICKET_CREATED_MANAGER', subject: 'New Ticket Alert: [{{ticketNumber}}] {{subject}}', body: 'Hello,\n\nA new support ticket has been created in your department and requires triage.\n\nTicket Number: {{ticketNumber}}\nSubject: {{subject}}\n\nPlease log in to the portal to review the details and assign it to the appropriate agent or team.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'TICKET_ASSIGNED', subject: 'Ticket Assigned: [{{ticketNumber}}] {{subject}}', body: 'Hello,\n\nA new support ticket has been assigned to you.\n\nTicket Number: {{ticketNumber}}\nSubject: {{subject}}\n\nPlease log in to the portal to review the details and begin working on this request.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'AGENT_REPLY', subject: 'Re: [{{ticketNumber}}] {{subject}}', body: 'Hello,\n\nAn agent has replied to your support ticket:\n\n{{message}}\n\nPlease log in to the portal to view the full thread or respond to this message.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'USER_REPLY', subject: 'Alert: New Reply on Ticket [{{ticketNumber}}]', body: 'Hello,\n\nA customer has replied to a ticket assigned to you:\n\nCustomer: {{userName}}\nMessage: {{message}}\n\nPlease log in to the dashboard to respond.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'TICKET_RESOLVED', subject: 'Ticket Resolved: [{{ticketNumber}}] {{subject}}', body: 'Hello,\n\nYour support ticket regarding "{{subject}}" has been marked as resolved.\n\nTicket Number: {{ticketNumber}}\n\nIf you are still experiencing issues or need further assistance, please reply to this email or log in to the portal to reopen the ticket. Otherwise, no further action is required.\n\nBest regards,\nThe Support Team', isEnabled: true },
      { type: 'TICKET_CLOSED', subject: 'Ticket Closed: [{{ticketNumber}}] {{subject}}', body: 'Hello,\n\nWe are writing to inform you that your support ticket regarding "{{subject}}" has been officially closed.\n\nTicket Number: {{ticketNumber}}\n\nIf you need to raise a new issue in the future, please don\'t hesitate to create a new ticket.\n\nThank you for contacting support!\n\nBest regards,\nThe Support Team', isEnabled: true }
    ];

    for (const tpl of defaults) {
      const exists = await this.prisma.emailTemplate.findUnique({ where: { type: tpl.type } });
      if (!exists) {
        await this.prisma.emailTemplate.create({ data: tpl });
      }
    }
  }

  // --- Encryption Helpers ---
  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), this.iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex') + ':' + this.iv.toString('hex');
  }

  private decrypt(text: string): string {
    try {
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.pop() as string, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (e) {
      return text;
    }
  }

  // --- SMTP Settings ---
  async getSettings() {
    const settings = await this.prisma.emailSetting.findFirst();
    if (!settings) {
      return { id: null, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', encryption: 'STARTTLS', imapHost: '', imapPort: 993, imapUser: '', imapPass: '' };
    }
    return { ...settings, smtpPass: '', imapPass: '' };
  }

  async updateSettings(dto: any) {
    if (dto.id !== undefined) delete dto.id;
    const existing = await this.prisma.emailSetting.findFirst();

    if (dto.smtpPass && dto.smtpPass.trim() !== '') {
      dto.smtpPass = this.encrypt(dto.smtpPass);
    } else {
      delete dto.smtpPass;
    }

    if (dto.imapPass && dto.imapPass.trim() !== '') {
      dto.imapPass = this.encrypt(dto.imapPass);
    } else {
      delete dto.imapPass;
    }

    if (existing) {
      return this.prisma.emailSetting.update({ where: { id: existing.id }, data: dto });
    }
    return this.prisma.emailSetting.create({ data: dto });
  }

  async getDecryptedSettings() {
    const settings = await this.prisma.emailSetting.findFirst();
    if (!settings) return null;
    return {
      ...settings,
      smtpPass: settings.smtpPass ? this.decrypt(settings.smtpPass) : '',
      imapPass: settings.imapPass ? this.decrypt(settings.imapPass) : '',
    };
  }

  // --- Email Template CRUD ---
  async getTemplates() { return this.prisma.emailTemplate.findMany(); }

  async createTemplate(dto: any) {
    return this.prisma.emailTemplate.create({
      data: { type: dto.type.toUpperCase().replace(/\s/g, '_'), subject: dto.subject, body: dto.body, isEnabled: dto.isEnabled ?? true },
    });
  }

  async updateTemplate(id: number, dto: any) {
    return this.prisma.emailTemplate.update({
      where: { id }, data: { subject: dto.subject, body: dto.body, isEnabled: dto.isEnabled },
    });
  }

  async deleteTemplate(id: number) { return this.prisma.emailTemplate.delete({ where: { id } }); }
}