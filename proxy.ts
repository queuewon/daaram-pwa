import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE_NAME, hashPassword } from "./lib/infra/gate";

const PUBLIC_PATHS = ["/gate", "/api/gate"];

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const gatePassword = process.env.GATE_PASSWORD;
  const cookieValue = req.cookies.get(GATE_COOKIE_NAME)?.value;
  const expected = gatePassword ? await hashPassword(gatePassword) : null;

  if (expected && cookieValue === expected) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/gate", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
