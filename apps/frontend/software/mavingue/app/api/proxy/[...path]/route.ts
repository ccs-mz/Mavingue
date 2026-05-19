
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const MAX_RETRIES = 2;
const TIMEOUT_MS = 15000;

function urlFor(req: NextRequest, parts: string[]) {
  const base = BACKEND.replace(/\/+$/, "");
  const pathname = parts.join("/");
  return `${base}/${pathname}${req.nextUrl.search}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Fun redirecionar  login
function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/auth/login", req.url);
  const response = NextResponse.redirect(loginUrl);
  
  // Limpar os cookies
  response.cookies.delete("token");
  response.cookies.delete("role");
  
  return response;
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = urlFor(req, path);

  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const incomingAuthorization = req.headers.get("authorization");
  if (incomingAuthorization) {
    headers.set("authorization", incomingAuthorization);
  } else {
    const token = req.cookies.get("token")?.value;
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers };

  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer();
    if (body.byteLength) init.body = body;
  }

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const upstream = await fetchWithTimeout(url, init, TIMEOUT_MS);
      
      // Se token expirado (401), redireciona para login
      if (upstream.status === 401) {
        console.log("Token expirado, redirecionando para login");
        return redirectToLogin(req);
      }
      
      const outHeaders = new Headers();
      const uct = upstream.headers.get("content-type");
      if (uct) outHeaders.set("content-type", uct);
      outHeaders.set("cache-control", "no-store");

      const data = await upstream.arrayBuffer();
      
      if ((upstream.status === 502 || upstream.status === 503 || upstream.status === 504) && attempt < MAX_RETRIES) {
        console.warn(`⚠️ Proxy: erro ${upstream.status} (tentativa ${attempt}/${MAX_RETRIES}) para ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return new NextResponse(data, { status: upstream.status, headers: outHeaders });
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Proxy erro (tentativa ${attempt}/${MAX_RETRIES}):`, error.message);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error(`❌ Proxy: todas as tentativas falharam para ${url}`);
  
  return NextResponse.json(
    { 
      error: "O servidor está temporariamente indisponível. Por favor, tenta novamente dentro de alguns instantes.",
      code: "SERVICE_UNAVAILABLE",
      status: 502
    },
    { status: 502 }
  );
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;