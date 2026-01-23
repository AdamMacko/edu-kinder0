import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL; // bez fallbacku!

async function proxy(req: Request, pathParts: string[] | undefined) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, error: "BACKEND_URL missing on Vercel" },
        { status: 500 }
      );
    }

    const parts = Array.isArray(pathParts) ? pathParts : [];
  if (!parts || parts.length === 0) {
  // Next.js prefetch / HEAD / metadata request – ignorujeme
  return new NextResponse(null, { status: 204 });
}



    const cookie = (await headers()).get("cookie") ?? "";
    const url = new URL(req.url);

    const target = new URL(`${BACKEND_URL}/api/payment/${parts.join("/")}`);
    target.search = url.search;

    const method = req.method.toUpperCase();
    const body =
      method === "GET" || method === "HEAD" ? undefined : await req.text();

    const forwardHeaders: Record<string, string> = {
      accept: "application/json",
    };
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

    // vráť to ako text, ale s korektným statusom
    const res = new NextResponse(text, { status: r.status });

    const respCt = r.headers.get("content-type");
    res.headers.set("content-type", respCt || "application/json; charset=utf-8");

    const setCookies = (r.headers as any).getSetCookie?.() as string[] | undefined;
    if (setCookies?.length) for (const c of setCookies) res.headers.append("set-cookie", c);
    else {
      const single = r.headers.get("set-cookie");
      if (single) res.headers.append("set-cookie", single);
    }

    return res;
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message ?? String(e),
        note: "Proxy crashed before receiving backend response",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params?.path);
}
export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params?.path);
}
export async function PUT(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params?.path);
}
export async function PATCH(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params?.path);
}
export async function DELETE(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params?.path);
}
