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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  get corsOrigin(): string {
    return resolveCorsOrigin(process.env.CORS_ORIGIN);
  },
};
