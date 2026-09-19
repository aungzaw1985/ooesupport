import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { StaffModule } from './staff/staff.module';
import { FormsModule } from './forms/forms.module';
import { AuthModule } from './auth/auth.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { EmailModule } from './email/email.module';
import { SlaModule } from './sla/sla.module';
import { ScheduleModule } from './schedule/schedule.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EmailSettingsModule } from './email-settings/email-settings.module';
import { TeamsModule } from './teams/teams.module';
import { TasksModule } from './tasks/tasks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CannedResponsesModule } from './canned-responses/canned-responses.module';
import { AutomationModule } from './automation/automation.module';
import { AuditModule } from './audit/audit.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { KbModule } from './kb/kb.module';
import { CompanySettingsModule } from './company-settings/company-settings.module';
import { TicketStatusesModule } from './ticket-statuses/ticket-statuses.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    TicketsModule,
    UsersModule,
    DepartmentsModule,
    StaffModule,
    FormsModule,
    AuthModule,
    AttachmentsModule,
    EmailModule,
    SlaModule,
    AutomationModule,
    ScheduleModule,
    OrganizationsModule,
    EmailSettingsModule,
    TeamsModule,
    TasksModule,
    AnalyticsModule,
    CannedResponsesModule,
    AuditModule,
    KbModule,
    CompanySettingsModule,
    TicketStatusesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}