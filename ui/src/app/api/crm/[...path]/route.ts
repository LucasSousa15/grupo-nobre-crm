import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };

const crmApiUrl = (process.env.CRM_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const destination = new URL(`${crmApiUrl}/${path.join("/")}`);
  destination.search = request.nextUrl.search;

  try {
    const response = await fetch(destination, {
      method: request.method,
      headers: {
        Accept: request.headers.get("accept") ?? "application/json",
        ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type")! } : {}),
      },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ message: "Não foi possível conectar à API do CRM." }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
