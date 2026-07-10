import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createGateToken,
  GATE_COOKIE_NAME,
  GATE_COOKIE_TTL_SECONDS,
  GATE_FAILURE_DELAY_MS,
  sleep,
  timingSafeEqual,
} from "../../../lib/infra/gate";

const gateLoginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request): Promise<NextResponse> {
  const raw = await request.json().catch(() => null);
  const parsed = gateLoginSchema.safeParse(raw);
  const expectedPassword = process.env.GATE_PASSWORD;

  if (
    !parsed.success ||
    !expectedPassword ||
    !timingSafeEqual(parsed.data.password, expectedPassword)
  ) {
    await sleep(GATE_FAILURE_DELAY_MS);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await createGateToken(expectedPassword, new Date(), GATE_COOKIE_TTL_SECONDS);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: GATE_COOKIE_TTL_SECONDS,
  });
  return response;
}
