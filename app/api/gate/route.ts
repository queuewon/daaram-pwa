import { NextResponse } from "next/server";
import { z } from "zod";
import { GATE_COOKIE_NAME, hashPassword } from "../../../lib/infra/gate";

const gateLoginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request): Promise<NextResponse> {
  const raw = await request.json().catch(() => null);
  const parsed = gateLoginSchema.safeParse(raw);

  const expectedPassword = process.env.GATE_PASSWORD;
  if (!parsed.success || !expectedPassword || parsed.data.password !== expectedPassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const hashed = await hashPassword(expectedPassword);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE_NAME, hashed, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  return response;
}
