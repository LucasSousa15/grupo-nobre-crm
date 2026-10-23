export abstract class ApplicationError extends Error {
  constructor(message: string, readonly statusCode = 400, readonly code?: string) {
    super(message);
  }
}
