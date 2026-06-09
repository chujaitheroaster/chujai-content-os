import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.appSetting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) result[s.key] = s.value;

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value, updatedById: session.user.id },
      create: { key, value, updatedById: session.user.id },
    });
  }

  return NextResponse.json({ success: true });
}
