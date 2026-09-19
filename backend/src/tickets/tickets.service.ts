import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { GetTicketsDto } from './dto/get-tickets.dto';
import { CreateThreadEntryDto } from './dto/create-thread-entry.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InboundEmailDto } from '../email/dto/inbound-email.dto';
import { TicketsGateway } from './tickets.gateway';
import { EmailService } from '../email/email.service';
import { SlaService } from '../sla/sla.service';
import { ScheduleService } from '../schedule/schedule.service';
import { TicketNumberService } from './ticket-number.service';
import { AutomationService } from '../automation/automation.service';
import sanitizeHtml from 'sanitize-html';
import { TicketPriority } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
    private emailService: EmailService,
    private slaService: SlaService,
    private ticketNumberService: TicketNumberService,
    private automationService: AutomationService,
    private notificationsService: NotificationsService
  ) {}

  private sanitizeRichText(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'blockquote'],
      allowedAttributes: {
        'a': ['href', 'target', 'rel']
      },
      allowedSchemes: ['http', 'https', 'mailto']
    });
  }

  private async calculateDueDate(priority: string): Promise<Date> {
    return this.slaService.calculateDueDate(priority);
  }

  async createTicket(dto: CreateTicketDto, userRole?: string, userOrgId?: number) {
    let priority: TicketPriority = 'NORMAL';
    let formSlaId: number | undefined = undefined;
    let deptId: number = dto.deptId || 1; 
    let customData = dto.customData ?? {};
    
    // Fetch form config to get prefix/sequence settings
    let ticketPrefix = 'TCK';
    let ticketSeqType = 'SEQUENTIAL';

    if (dto.formId) {
      const form = await this.prisma.form.findUnique({ 
        where: { id: dto.formId }, 
        include: { sla: true, organizations: true } 
      });
      
      if (form) {
        if (userRole === 'USER') {
          if (!userOrgId) throw new BadRequestException('You must belong to an organization to use this form.');
          const isAssigned = form.organizations.some(of => of.orgId === userOrgId);
          if (!isAssigned) throw new BadRequestException('You do not have access to this form.');
        }

        if (form.deptId) deptId = form.deptId; 
        if (form.sla) {
          formSlaId = form.sla.id;
          if (form.sla.priority) priority = form.sla.priority as TicketPriority;
        }
        
        // Get Ticket Config from Form
        if (form.ticketPrefix) ticketPrefix = form.ticketPrefix;
        if (form.ticketSeqType) ticketSeqType = form.ticketSeqType;
      }
    } else if (userRole === 'USER') {
      throw new BadRequestException('Please select a Help Topic.');
    }

    // Generate the custom Ticket Number
    const ticketNumber = await this.ticketNumberService.generateTicketNumber(ticketPrefix, ticketSeqType);

    const dueDate = await this.slaService.calculateDueDate(priority, formSlaId);
    const responseDueDate = await this.slaService.calculateDueDate(priority, formSlaId, true);
    const resolutionDueDate = await this.slaService.calculateDueDate(priority, formSlaId, false);

    try {
      const newTicket = await this.prisma.ticket.create({
        data: {
          number: ticketNumber,
          subject: dto.subject,
          userId: dto.userId,
          deptId: deptId,
          priority: priority,
          status: 'OPEN',
          customData: customData,
          dueDate: dueDate,
          responseDueDate: responseDueDate,
          slaId: formSlaId,
          formId: dto.formId || null,
          thread: {
            create: {
              entries: {
                create: {
                  type: 'message',
                  body: dto.message,
                },
              },
            },
          },
        },
        include: {
          thread: { include: { entries: true } },
          department: true,
          user: true,
        },
      });

      this.ticketsGateway.emitNewTicket(newTicket);
      const managers = await this.prisma.staff.findMany({ 
        where: { role: 'MANAGER', deptId: newTicket.deptId } 
      });
      
      for (const manager of managers) {
        await this.emailService.sendDynamicEmail(
          manager.email,
          'TICKET_CREATED_MANAGER',
          { ticketNumber: newTicket.number, subject: newTicket.subject }
        );
      }
      
      await this.automationService.executeRules(newTicket, 'TICKET_CREATED');

      if (newTicket.user) {
        await this.emailService.sendDynamicEmail(
          newTicket.user.email,
          'TICKET_CREATED',
          {
            ticketNumber: newTicket.number,
            subject: newTicket.subject,
            message: dto.message
          }
        );
      }

      return newTicket;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create ticket: ' + message);
    }
  }

  async getTickets(query: GetTicketsDto, user?: any) {
    console.log('Fetching tickets for user:', user);
    const { page, limit, status, priority, search, sort, order, deptId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();
    if (deptId) where.deptId = Number(deptId);

    // --- ENTERPRISE VISIBILITY LOGIC ---
    const role = (user.role || '').toUpperCase();
    const visibilityConditions: any[] = [];
    
    if (role === 'USER') {
      visibilityConditions.push({ userId: user.id });
    } else if (role === 'MANAGER' && user.orgId) {
      // Organization Manager (Customer Portal)
      visibilityConditions.push({ user: { orgId: user.orgId } });
    } else if (role === 'MANAGER' || role === 'TEAM_LEADER' || role === 'AGENT') {
      // Department Managers, Team Leaders, and Agents
      
      if (query.view === 'mine') {
        // Only tickets assigned to this specific staff member
        visibilityConditions.push({ staffId: user.id });
      } else if (query.view === 'unassigned') {
        // Unassigned tickets in their department or team
        if (role === 'MANAGER') {
          visibilityConditions.push({ staffId: null, deptId: user.deptId });
        } else if (role === 'TEAM_LEADER') {
          visibilityConditions.push({ staffId: null, teamId: user.teamId });
        } else {
          visibilityConditions.push({ staffId: null, deptId: user.deptId });
        }
      } else {
        // 'all' (Default)
        if (role === 'MANAGER') {
          visibilityConditions.push({ deptId: user.deptId });
        } else if (role === 'TEAM_LEADER') {
          visibilityConditions.push({ teamId: user.teamId });
        } else {
          // Agent
          visibilityConditions.push({ staffId: user.id });
          visibilityConditions.push({ staffId: null, deptId: user.deptId });
        }
      }
    }
    // Admins (role === 'ADMIN') have no filter, they see everything.

    if (query.customFilterField && query.customFilterValue) {
      where.AND = where.AND || [];
      where.AND.push({
        customData: {
          path: [query.customFilterField],
          string_contains: query.customFilterValue
        }
      });
    }
    
    if (search) {
      const searchConditions = [
        { number: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
      
      where.AND = [
        { OR: visibilityConditions },
        { OR: searchConditions }
      ];
    } else {
      if (visibilityConditions.length > 0) {
        where.OR = visibilityConditions;
      }
    }
   
    if (query.tag) {
      where.AND = [...(where.AND || []), { tags: { some: { name: query.tag } } }];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, name: true, email: true } },
          staff: { select: { id: true, firstname: true, lastname: true } },
          team: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTicketsForExport() {
    return this.prisma.ticket.findMany({
      include: {
        user: { select: { name: true, email: true } },
        staff: { select: { firstname: true, lastname: true } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });
  }

  async getTicketById(id: number, user?: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        // Update user include to bring in organization and their recent tickets
        user: {
          include: {
            organization: true,
            tickets: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, number: true, subject: true, status: true, createdAt: true }
            }
          }
        },
        staff: { select: { id: true, firstname: true, lastname: true, email: true, phone: true } },
        department: true,
        thread: { include: { entries: true } },
        form: { include: { fields: true } },
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    // --- SECURITY & VISIBILITY FILTERING ---
    if (user && user.role === 'USER') {
      // 1. Ensure the user owns the ticket
      if (ticket.userId !== user.id) {
        throw new ForbiddenException('You do not have access to this ticket.');
      }

      // 2. Strip internal fields from customData
      if (ticket.customData && typeof ticket.customData === 'object' && ticket.form) {
        const formFields = ticket.form.fields || [];
        const internalFieldNames = formFields
          .filter(f => ['INTERNAL_OPTIONAL', 'INTERNAL_REQUIRED', 'REQUIRED_AGENTS'].includes(f.visibility))
          .map(f => f.name);

        // Clone customData to mutate it
        const filteredCustomData = { ...(ticket.customData as object) };
        
        // Delete internal keys
        internalFieldNames.forEach(key => {
          delete filteredCustomData[key];
        });

        ticket.customData = filteredCustomData;
      }
    }

    return ticket;
  }

  async getTicketsByUser(userId: number) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
      },
    });
  }

    async getTicketStats(user?: any) {
    const where: any = {};
    const role = (user.role || '').toUpperCase();
    
    // --- ENTERPRISE VISIBILITY LOGIC ---
    if (role === 'USER') {
      where.userId = user.id;
    } else if (role === 'MANAGER' && user.orgId) {
      where.user = { orgId: user.orgId };
    } else if (role === 'MANAGER') {
      where.deptId = user.deptId;
    } else if (role === 'TEAM_LEADER') {
      where.teamId = user.teamId;
    } else if (role === 'AGENT') {
      // Agents see tickets assigned to them OR unassigned tickets in their department
      where.OR = [
        { staffId: user.id },
        { staffId: null, deptId: user.deptId }
      ];
    }
    // If role is 'ADMIN', no filter is applied, so they see everything.

    const statusCounts = await this.prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
      where,
    });

    const priorityCounts = await this.prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true },
      where,
    });

    const statusData = statusCounts.map(s => ({ name: s.status, value: s._count.id }));
    const priorityData = priorityCounts.map(p => ({ name: p.priority, value: p._count.id }));

    const totalTickets = await this.prisma.ticket.count({ where });

    return {
      totalTickets,
      statusData,
      priorityData,
    };
  }

  async updateTicket(id: number, dto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { thread: true, user: true }
    });
    
    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    const events: { type: string, message: string }[] = [];
    if (dto.status && dto.status !== ticket.status) {
      events.push({ type: 'status', message: `Status changed from ${ticket.status} to ${dto.status}` });
    }
    if (dto.priority && dto.priority !== ticket.priority) {
      events.push({ type: 'priority', message: `Priority changed from ${ticket.priority} to ${dto.priority}` });
    }
    
    // --- FIX: Look up actual Staff Name ---
    if (dto.staffId !== undefined && dto.staffId !== ticket.staffId) {
      let message = 'Ticket unassigned';
      if (dto.staffId) {
        const staff = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
        message = `Ticket assigned to Agent: ${staff?.firstname || ''} ${staff?.lastname || ''}`;
      }
      events.push({ type: 'assigned', message });
    }

    // --- FIX: Look up actual Team Name ---
    if (dto.teamId !== undefined && dto.teamId !== ticket.teamId) {
      let message = 'Ticket unassigned from team';
      if (dto.teamId) {
        const team = await this.prisma.team.findUnique({ where: { id: dto.teamId } });
        message = `Ticket assigned to Team: ${team?.name || ''}`;
      }
      events.push({ type: 'assigned', message });
    }

    let newDueDate = ticket.dueDate;
    if (dto.priority && dto.priority !== ticket.priority) {
      newDueDate = await this.slaService.calculateDueDate(dto.priority);
      events.push({ type: 'sla', message: `SLA recalculated. New due date: ${newDueDate.toLocaleString()}` });
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: dto.status as any,
        priority: dto.priority as any,
        staffId: dto.staffId,
        teamId: dto.teamId,
        deptId: dto.deptId,
        dueDate: newDueDate,
      },
    });

    if (ticket.thread && events.length > 0) {
      await this.prisma.threadEvent.createMany({
        data: events.map(e => ({
          threadId: ticket.thread.id,
          type: e.type,
          message: e.message,
          staffId: dto.staffId ?? null,
        }))
      });
    }

    // --- SMART LIFECYCLE EMAILS & NOTIFICATIONS ---

    // 1. Ticket Assigned -> Alert the Agent
    if (dto.staffId !== undefined && dto.staffId !== ticket.staffId) {
      if (dto.staffId) {
        const assignedStaff = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
        if (assignedStaff) {
          // Send Email
          await this.emailService.sendDynamicEmail(
            assignedStaff.email,
            'TICKET_ASSIGNED',
            { ticketNumber: ticket.number, subject: ticket.subject }
          );

          // --- CREATE IN-APP NOTIFICATION ---
          const notification = await this.notificationsService.createNotification(
            assignedStaff.id, 
            null, 
            ticket.id, 
            `Ticket ${ticket.number} was assigned to you`
          );
          // Emit via WebSocket to update the bell icon instantly
          this.ticketsGateway.server.emit('notification:new', notification);
        }
      }
    }

    // 2. Status Changed -> Alert the User
    if (dto.status && dto.status !== ticket.status && ticket.user) {
      if (dto.status === 'RESOLVED') {
        await this.emailService.sendDynamicEmail(
          ticket.user.email,
          'TICKET_RESOLVED',
          { ticketNumber: ticket.number, subject: ticket.subject }
        );
      } else if (dto.status === 'CLOSED') {
        await this.emailService.sendDynamicEmail(
          ticket.user.email,
          'TICKET_CLOSED',
          { ticketNumber: ticket.number, subject: ticket.subject }
        );
      }
    }

    this.ticketsGateway.emitTicketUpdated(ticket.id);

    return updatedTicket;
  }

  async getTicketThread(ticketId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        thread: {
          include: {
            entries: {
              orderBy: { createdAt: 'asc' },
              include: { attachments: true },
            },
            events: {
              orderBy: { createdAt: 'asc' },
            }
          },
        },
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    return ticket.thread;
  }

  async addThreadEntry(ticketId: number, dto: CreateThreadEntryDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { 
        thread: true,
        user: true,
        staff: true,
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    if (!ticket.thread) {
      await this.prisma.thread.create({
        data: { ticketId: ticket.id },
      });
    }

    const cleanBody = this.sanitizeRichText(dto.body);

    const entry = await this.prisma.threadEntry.create({
      data: {
        threadId: ticket.thread.id,
        type: dto.type,
        body: cleanBody,
      },
    });

    if (dto.type === 'response' && !ticket.firstResponseAt) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() }
      });
    }

    if (dto.type === 'response' || dto.type === 'note') {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });
    }

    this.ticketsGateway.emitNewThreadEntry(ticketId, entry);
    this.ticketsGateway.emitTicketUpdated(ticketId);

    // --- SMART EMAIL ROUTING & NOTIFICATIONS ---

    // 1. Agent replied to the ticket -> Alert the User
    if (dto.type === 'response' && ticket.user) {
      await this.emailService.sendDynamicEmail(
        ticket.user.email,
        'AGENT_REPLY',
        {
          ticketNumber: ticket.number,
          subject: ticket.subject,
          message: cleanBody
        }
      );
    }

    // 2. User replied to the ticket -> Alert the Assigned Agent
    if (dto.type === 'message' && ticket.staff) {
      // Send Email Alert
      await this.emailService.sendDynamicEmail(
        ticket.staff.email,
        'USER_REPLY',
        {
          ticketNumber: ticket.number,
          subject: ticket.subject,
          message: cleanBody,
          userName: ticket.user?.name || 'A customer'
        }
      );

      // --- CREATE IN-APP NOTIFICATION ---
      const notification = await this.notificationsService.createNotification(
        ticket.staff.id, 
        null, 
        ticket.id, 
        `User replied to Ticket ${ticket.number}`
      );
      // Emit via WebSocket to update the bell icon instantly
      this.ticketsGateway.server.emit('notification:new', notification);
    }

    return entry;
  }

  async addEmailReplyToThread(dto: InboundEmailDto) {
    const match = dto.subject.match(/\[TCK-(\d+)\]/);
    if (!match) {
      throw new BadRequestException('No valid ticket number found in email subject');
    }
    
    const ticketNumber = `TCK-${match[1]}`;

    const ticket = await this.prisma.ticket.findUnique({
      where: { number: ticketNumber },
      include: { thread: true, user: true },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    if (ticket.user.email.toLowerCase() !== dto.from.toLowerCase()) {
      throw new BadRequestException('Sender email does not match ticket owner');
    }

    if (!ticket.thread) {
      await this.prisma.thread.create({
        data: { ticketId: ticket.id },
      });
    }

    const entry = await this.prisma.threadEntry.create({
      data: {
        threadId: ticket.thread.id,
        type: 'message',
        body: dto.body,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    this.ticketsGateway.emitNewThreadEntry(ticket.id, entry);
    this.ticketsGateway.emitTicketUpdated(ticket.id);

    return { message: 'Email reply added to ticket successfully', entry };
  }

  async escalateTicket(ticketId: number, dto: any, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { thread: true, department: true }
    });

    if (!ticket) throw new BadRequestException('Ticket not found');

    const events: any[] = [];
    let updateData: any = {};

    if (dto.targetType === 'LEADER') {
      // Find the leader of the ticket's current team
      const team = await this.prisma.team.findUnique({
        where: { id: dto.targetId },
        include: { leader: true }
      });

      if (team?.leader) {
        updateData.staffId = team.leader.id;
        updateData.teamId = team.id;
        events.push({ type: 'escalation', message: `Ticket escalated to Team Leader: ${team.leader.firstname} ${team.leader.lastname}` });
      } else {
        throw new BadRequestException('This team does not have a leader assigned.');
      }
    } else if (dto.targetType === 'MANAGER') {
      // Find the manager of the ticket's current department
      const manager = await this.prisma.staff.findFirst({
        where: { deptId: ticket.deptId, role: 'MANAGER' }
      });

      if (manager) {
        updateData.staffId = manager.id;
        events.push({ type: 'escalation', message: `Ticket escalated to Department Manager: ${manager.firstname} ${manager.lastname}` });
      } else {
        throw new BadRequestException('This department does not have a Manager assigned.');
      }
    } else if (dto.targetType === 'TEAM') {
      // Transfer to another team entirely
      const targetTeam = await this.prisma.team.findUnique({ where: { id: dto.targetId } });
      if (!targetTeam) throw new BadRequestException('Target team not found.');
      
      updateData.teamId = targetTeam.id;
      updateData.staffId = null; // Unassign individual agent
      events.push({ type: 'escalation', message: `Ticket escalated/transfered to Team: ${targetTeam.name}` });
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    });

    if (ticket.thread && events.length > 0) {
      await this.prisma.threadEvent.createMany({
        data: events.map(e => ({
          threadId: ticket.thread.id,
          type: e.type,
          message: e.message,
          staffId: user.id,
        }))
      });
    }

    this.ticketsGateway.emitTicketUpdated(ticketId);

    return updatedTicket;
  }

  async rateTicket(id: number, rating: number, comment: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new BadRequestException('Ticket not found');
    
    // Security: Only the ticket owner can rate it
    if (user.role === 'USER' && ticket.userId !== user.id) {
      throw new ForbiddenException('You can only rate your own tickets.');
    }

    // Business Logic: Only allow rating if ticket is Resolved or Closed
    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      throw new BadRequestException('Ticket must be resolved before rating.');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { rating, ratingComment: comment || null }
    });
  }

  // Add Tag method
  async addTag(ticketId: number, tagName: string) {
    const tag = await this.prisma.tag.upsert({
      where: { name: tagName.toLowerCase() },
      update: {},
      create: { name: tagName.toLowerCase() },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { tags: { connect: { id: tag.id } } },
    });

    return tag;
  }

  async removeTag(ticketId: number, tagName: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { tags: { disconnect: { name: tagName.toLowerCase() } } },
    });
  }

  // Add Merge method
  async mergeTickets(primaryId: number, secondaryId: number) {
    const primaryTicket = await this.prisma.ticket.findUnique({ where: { id: primaryId }, include: { thread: true } });
    const secondaryTicket = await this.prisma.ticket.findUnique({ where: { id: secondaryId }, include: { thread: true } });

    if (!primaryTicket || !secondaryTicket) throw new BadRequestException('Ticket not found');
    if (!primaryTicket.thread || !secondaryTicket.thread) throw new BadRequestException('Thread not found');

    // Move all thread entries from secondary to primary
    await this.prisma.threadEntry.updateMany({
      where: { threadId: secondaryTicket.thread.id },
      data: { threadId: primaryTicket.thread.id },
    });

    // Close and link the secondary ticket
    return this.prisma.ticket.update({
      where: { id: secondaryId },
      data: { 
        status: 'CLOSED', 
        mergedIntoId: primaryId,
        // Optional: Add an audit event
      },
    });
  }

  async startTimer(ticketId: number, staffId: number) {
    // Stop any existing active timers for this staff member on this ticket
    await this.prisma.timeLog.updateMany({
      where: { ticketId, staffId, endTime: null },
      data: { endTime: new Date() }
    });

    return this.prisma.timeLog.create({
      data: {
        ticketId,
        staffId,
        startTime: new Date(),
      }
    });
  }

  async stopTimer(ticketId: number, staffId: number) {
    const activeLog = await this.prisma.timeLog.findFirst({
      where: { ticketId, staffId, endTime: null }
    });

    if (!activeLog) throw new BadRequestException('No active timer found');

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - activeLog.startTime.getTime()) / 60000);

    return this.prisma.timeLog.update({
      where: { id: activeLog.id },
      data: { endTime, durationMinutes }
    });
  }

  async getTimeLogs(ticketId: number) {
    const logs = await this.prisma.timeLog.findMany({
      where: { ticketId },
      include: { staff: { select: { firstname: true, lastname: true } } },
      orderBy: { startTime: 'desc' }
    });

    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    return { logs, totalMinutes };
  }
}