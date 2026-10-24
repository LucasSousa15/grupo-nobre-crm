import { Module } from '@nestjs/common';
import { SellerNotificationService } from './seller-notification.service';

@Module({
  providers: [SellerNotificationService],
  exports: [SellerNotificationService],
})
export class SellerNotificationModule {}
