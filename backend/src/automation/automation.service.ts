import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) {}

  async executeRules(ticket: any, trigger: string) {
    const rules = await this.prisma.automationRule.findMany({ 
      where: { trigger, isEnabled: true } 
    });

    for (const rule of rules) {
      const conditions = rule.conditions as any[];
      const matches = conditions.every(c => {
        const ticketValue = (ticket[c.field] || '').toString().toLowerCase();
        const ruleValue = (c.value || '').toString().toLowerCase();
        
        if (c.operator === 'contains') return ticketValue.includes(ruleValue);
        if (c.operator === 'equals') return ticketValue === ruleValue;
        return false;
      });

      if (matches) {
        this.logger.log(`Rule '${rule.name}' matched on Ticket #${ticket.id}`);
        await this.applyActions(ticket.id, rule.actions as any[]);
      }
    }
  }

  private async applyActions(ticketId: number, actions: any[]) {
    const updateData: any = {};
    
    for (const action of actions) {
      if (action.type === 'SET_PRIORITY') updateData.priority = action.value;
      if (action.type === 'SET_STATUS') updateData.status = action.value;
      if (action.type === 'ASSIGN_TEAM') updateData.teamId = Number(action.value);
      if (action.type === 'ASSIGN_AGENT') updateData.staffId = Number(action.value);
      if (action.type === 'ASSIGN_DEPT') updateData.deptId = Number(action.value);
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.ticket.update({ where: { id: ticketId }, data: updateData });
    }
  }

  async findAll() {
    return this.prisma.automationRule.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: any) {
    return this.prisma.automationRule.create({
      data: {
        name: dto.name,
        trigger: dto.trigger,
        conditions: dto.conditions,
        actions: dto.actions,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.automationRule.delete({ where: { id } });
  }
}
