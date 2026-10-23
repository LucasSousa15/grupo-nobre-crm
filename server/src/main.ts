import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { env } from './core/config/env';
import { GlobalExceptionFilter } from './core/shared/errors/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Grupo Nobre CRM API')
    .setDescription('API REST para gestão de oportunidades da Nobre Brindes.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(env.port);
}

void bootstrap();
