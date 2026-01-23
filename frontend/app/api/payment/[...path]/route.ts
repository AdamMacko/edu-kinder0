import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

async function proxy(req: Request, pathParts: string[]) {
  const cookie = (await headers()).get("cookie") ?? "";
  const url = new URL(req.url);

  const target = new URL(`${BACKEND_URL}/api/payment/${pathParts.join("/")}`);
  target.search = url.search;

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.text();

  const forwardHeaders: Record<string, string> = {};
  if (cookie) forwardHeaders.cookie = cookie;
  const ct = req.headers.get("content-type");
  if (ct) forwardHeaders["content-type"] = ct;

  const r = await fetch(target.toString(), {
    method,
    headers: forwardHeaders,
    body,
    cache: "no-store",
  });

  const text = await r.text();
  const res = new NextResponse(text, { status: r.status });

  const respCt = r.headers.get("content-type");
  if (respCt) res.headers.set("content-type", respCt);

  const setCookies = (r.headers as any).getSetCookie?.() as string[] | undefined;
  if (setCookies?.length) for (const c of setCookies) res.headers.append("set-cookie", c);
  else {
    const single = r.headers.get("set-cookie");
    if (single) res.headers.append("set-cookie", single);
  }

  return res;
}


export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function PUT(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function PATCH(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function DELETE(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}