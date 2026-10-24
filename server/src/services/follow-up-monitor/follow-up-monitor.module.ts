import { Module } from '@nestjs/common';
import { OpportunitiesModule } from 'src/modules/opportunities/opportunities.module';
import { RemindersModule } from 'src/modules/reminders/reminders.module';
import { FollowUpMonitorService } from './follow-up-monitor.service';

@Module({
  imports: [OpportunitiesModule, RemindersModule],
  providers: [FollowUpMonitorService],
  exports: [FollowUpMonitorService],
})
export class FollowUpMonitorModule {}
