import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './core/providers/database/database.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { SellersModule } from './modules/sellers/sellers.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot(), CompaniesModule, OpportunitiesModule, SellersModule],
})
export class AppModule {}
