import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './core/providers/database/database.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot(), OpportunitiesModule],
})
export class AppModule {}
