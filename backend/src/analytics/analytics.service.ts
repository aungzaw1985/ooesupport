import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getBreakdown(groupBy: string) {
    // Fetch all tickets with necessary relations
    const tickets = await this.prisma.ticket.findMany({
      include: {
        staff: { select: { firstname: true, lastname: true } },
        user: { select: { name: true, organization: { select: { name: true } } } },
        department: { select: { name: true } },
        form: { select: { title: true } },
      },
      take: 10000, // Limit for performance
    });

    const groupedData: Record<string, { name: string; total: number; open: number; resolved: number }> = {};

    tickets.forEach(ticket => {
      let key = 'Unassigned';
      
      if (groupBy === 'AGENT' && ticket.staff) {
        key = `${ticket.staff.firstname} ${ticket.staff.lastname}`;
      } else if (groupBy === 'FORM' && ticket.form) {
        key = ticket.form.title;
      } else if (groupBy === 'ORG' && ticket.user?.organization) {
        key = ticket.user.organization.name;
      } else if (groupBy === 'USER' && ticket.user) {
        key = ticket.user.name;
      } else if (groupBy === 'DEPT' && ticket.department) {
        key = ticket.department.name;
      }

      if (!groupedData[key]) {
        groupedData[key] = { name: key, total: 0, open: 0, resolved: 0 };
      }

      groupedData[key].total++;
      if (ticket.status === 'OPEN') groupedData[key].open++;
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') groupedData[key].resolved++;
    });

    return Object.values(groupedData).sort((a, b) => b.total - a.total);
  }

    async getAdvancedMetrics() {
    const tickets = await this.prisma.ticket.findMany({
      include: {
        staff: { select: { firstname: true, lastname: true } },
      },
      take: 5000, // Limit for performance
    });

    // 1. MTTR (Mean Time to Resolution) by Priority
    const mttrMap: Record<string, { totalTime: number; count: number }> = {};
    tickets.forEach(t => {
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
        const hours = (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        if (!mttrMap[t.priority]) mttrMap[t.priority] = { totalTime: 0, count: 0 };
        mttrMap[t.priority].totalTime += hours;
        mttrMap[t.priority].count++;
      }
    });
    const mttrData = Object.keys(mttrMap).map(k => ({
      name: k,
      hours: Math.round((mttrMap[k].totalTime / mttrMap[k].count) * 10) / 10
    }));

    // 2. Ticket Arrival Heatmap (Day of Week x Hour of Day)
    const heatmapData: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxHeat = 0;
    tickets.forEach(t => {
      const day = t.createdAt.getDay();
      const hour = t.createdAt.getHours();
      heatmapData[day][hour]++;
      if (heatmapData[day][hour] > maxHeat) maxHeat = heatmapData[day][hour];
    });

    // 3. Agent Workload Distribution
    const workloadMap: Record<string, { open: number; closed: number }> = {};
    tickets.forEach(t => {
      const agentName = t.staff ? `${t.staff.firstname} ${t.staff.lastname}` : 'Unassigned';
      if (!workloadMap[agentName]) workloadMap[agentName] = { open: 0, closed: 0 };
      if (t.status === 'OPEN') workloadMap[agentName].open++;
      else workloadMap[agentName].closed++;
    });
    const workloadData = Object.keys(workloadMap).map(k => ({
      name: k,
      open: workloadMap[k].open,
      closed: workloadMap[k].closed
    })).sort((a, b) => (b.open + b.closed) - (a.open + a.closed)).slice(0, 10);

    // 4. SLA Breach Rate
    let breached = 0;
    let active = 0;
    tickets.forEach(t => {
      if (t.status === 'OPEN' && t.dueDate) {
        active++;
        if (new Date(t.dueDate).getTime() < Date.now()) breached++;
      }
    });
    const slaData = [
      { name: 'Compliant', value: active - breached },
      { name: 'Breached', value: breached }
    ];

    const ratedTickets = tickets.filter(t => t.rating !== null);
    const totalRatings = ratedTickets.length;
    const avgCsat = totalRatings > 0 
      ? Math.round((ratedTickets.reduce((sum, t) => sum + t.rating, 0) / totalRatings) * 10) / 10 
      : 0;

    const csatDistribution = [1, 2, 3, 4, 5].map(star => ({
      name: `${star} Star${star > 1 ? 's' : ''}`,
      count: ratedTickets.filter(t => t.rating === star).length
    }));

    return { mttrData, heatmapData, maxHeat, workloadData, slaData, avgCsat, totalRatings, csatDistribution };
  }
}
