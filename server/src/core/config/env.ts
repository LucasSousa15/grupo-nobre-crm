import "dotenv/config";

export function resolveCorsOrigin(value: string | undefined): string {
  const origin = value?.trim();
  if (!origin)
    throw new Error("CORS_ORIGIN deve ser configurada para iniciar a API.");

  try {
    const url = new URL(origin);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    const normalized = url.origin;
    if (normalized !== origin.replace(/\/$/, "")) {
      throw new Error();
    }
    return normalized;
  } catch {
    throw new Error(
      "CORS_ORIGIN deve conter uma origem única e válida, sem caminho.",
    );
  }
}

export function resolveNonNegativeInteger(
  value: string | undefined,
  name: string,
  defaultValue: number,
): number {
  if (value === undefined || value.trim() === '') return defaultValue;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} deve ser um nÃºmero inteiro maior ou igual a zero.`);
  }
  return Number(value);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  get corsOrigin(): string {
    return resolveCorsOrigin(process.env.CORS_ORIGIN);
  },
  get eventDeliveryLeadDays(): number {
    return resolveNonNegativeInteger(process.env.EVENT_DELIVERY_LEAD_DAYS, 'EVENT_DELIVERY_LEAD_DAYS', 14);
  },
  get rateLimitWindowSeconds(): number {
    return resolveNonNegativeInteger(process.env.RATE_LIMIT_WINDOW_SECONDS, 'RATE_LIMIT_WINDOW_SECONDS', 60);
  },
  get rateLimitMaxRequests(): number {
    return resolveNonNegativeInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 'RATE_LIMIT_MAX_REQUESTS', 120);
  },
};
