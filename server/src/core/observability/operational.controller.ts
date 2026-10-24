import { Controller, Get } from '@nestjs/common';
import { OperationalMetricsService } from './operational-metrics.service';

@Controller()
export class OperationalController {
  constructor(private readonly metrics: OperationalMetricsService) {}

  @Get('health')
  health() { return { status: 'ok' }; }

  @Get('metrics')
  metricsSnapshot() { return this.metrics.snapshot(); }
}
