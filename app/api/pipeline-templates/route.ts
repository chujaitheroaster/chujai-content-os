import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.pipelineTemplate.findMany({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}
