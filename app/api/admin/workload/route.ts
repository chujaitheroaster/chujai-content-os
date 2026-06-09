import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      tasksAssigned: {
        where: { status: { notIn: ["DONE", "BLOCKED"] } },
        include: {
          contentItem: { select: { id: true, title: true, platform: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    totalActive: user.tasksAssigned.length,
    overdue: user.tasksAssigned.filter(
      (t) => t.dueDate && new Date(t.dueDate) < today
    ).length,
    tasks: user.tasksAssigned,
  }));

  return NextResponse.json(result);
}
