import { Global, Module } from '@nestjs/common';
import { OperationalController } from './operational.controller';
import { OperationalMetricsService } from './operational-metrics.service';

@Global()
@Module({
  controllers: [OperationalController],
  providers: [OperationalMetricsService],
  exports: [OperationalMetricsService],
})
export class OperationalModule {}
