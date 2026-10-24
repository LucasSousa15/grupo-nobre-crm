import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './core/providers/database/database.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ProductsModule } from './modules/products/products.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { FollowUpMonitorModule } from './services/follow-up-monitor/follow-up-monitor.module';
import { OperationalModule } from './core/observability/operational.module';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    CompaniesModule,
    OpportunitiesModule,
    ProductsModule,
    SellersModule,
    RemindersModule,
    FollowUpMonitorModule,
    OperationalModule,
  ],
})
export class AppModule {}
