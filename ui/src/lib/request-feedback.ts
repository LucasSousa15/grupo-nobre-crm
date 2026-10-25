import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';

type ApiErrorPayload = {
  message?: unknown;
  details?: unknown;
};

export function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorPayload>(error)) return fallback;

  const { message, details } = error.response?.data ?? {};
  if (typeof message === 'string' && message !== 'Dados inválidos.') return message;
  if (Array.isArray(details) && typeof details[0] === 'string') return details[0];
  return fallback;
}

export function notifyRequestError(error: unknown, fallback: string): void {
  toast.error(getRequestErrorMessage(error, fallback));
}
