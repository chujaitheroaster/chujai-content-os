import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

export async function withRole(
  allowedRoles: Role[],
  handler: (req: Request, session: { user: { id: string; role: Role; name: string; email: string } }) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, session as { user: { id: string; role: Role; name: string; email: string } });
  };
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session as { user: { id: string; role: Role; name: string; email: string } };
}

export function isOwner(role: Role) {
  return role === "OWNER";
}

export function canCreateContent(role: Role) {
  return role === "OWNER" || role === "CONTENT_STRATEGIST";
}

export function canApprove(role: Role) {
  return role === "OWNER";
}
