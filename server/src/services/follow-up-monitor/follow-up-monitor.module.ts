import { Module } from '@nestjs/common';
import { OpportunitiesModule } from 'src/modules/opportunities/opportunities.module';
import { RemindersModule } from 'src/modules/reminders/reminders.module';
import { SellerNotificationModule } from 'src/services/seller-notifications/seller-notification.module';
import { FollowUpMonitorService } from './follow-up-monitor.service';

@Module({
  imports: [OpportunitiesModule, RemindersModule, SellerNotificationModule],
  providers: [FollowUpMonitorService],
  exports: [FollowUpMonitorService],
})
export class FollowUpMonitorModule {}
