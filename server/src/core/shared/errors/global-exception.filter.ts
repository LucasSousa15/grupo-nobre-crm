import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApplicationError } from './application.error';
import { OperationalMetricsService } from 'src/core/observability/operational-metrics.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly metrics: OperationalMetricsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Erro interno do servidor.';
    let details: unknown[] = [];

    if (exception instanceof ApplicationError) {
      status = exception.statusCode;
      code = exception.code ?? exception.constructor.name;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null) {
        const value = body as { message?: string | string[]; error?: string };
        code = Array.isArray(value.message) ? 'VALIDATION_ERROR' : (value.error ?? code);
        message = Array.isArray(value.message) ? 'Dados inválidos.' : (value.message ?? message);
        details = Array.isArray(value.message) ? value.message : [];
      } else {
        message = body;
      }
    } else {
      this.metrics.recordUnexpectedError();
      this.logger.error(
        { requestId: request.requestId, method: request.method, path: request.path, statusCode: status },
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({ statusCode: status, code, message, details, path: request.path, requestId: request.requestId });
  }
}
