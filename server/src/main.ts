import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { env } from "./core/config/env";
import { GlobalExceptionFilter } from "./core/shared/errors/global-exception.filter";
import { OperationalMetricsService } from "./core/observability/operational-metrics.service";
import { createRateLimitMiddleware } from "./core/security/rate-limit.middleware";

interface RequestWithCorrelation {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}

interface ResponseWithMetrics {
  statusCode: number;
  setHeader(name: string, value: string): void;
  on(event: 'finish', listener: () => void): void;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const metrics = app.get(OperationalMetricsService);
  app.use((request: RequestWithCorrelation, response: ResponseWithMetrics, next: () => void) => {
    const startedAt = Date.now();
    request.requestId = request.headers['x-request-id']?.toString() || crypto.randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.on('finish', () => metrics.recordRequest(response.statusCode, Date.now() - startedAt));
    next();
  });
  app.use(createRateLimitMiddleware(env.rateLimitWindowSeconds, env.rateLimitMaxRequests));
  app.enableCors({ origin: env.corsOrigin });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(metrics));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Grupo Nobre CRM API")
    .setDescription("API REST para gestão de oportunidades da Nobre Brindes.")
    .setVersion("0.1.0")
    .build();
  SwaggerModule.setup(
    "docs",
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(env.port);
}

void bootstrap();
