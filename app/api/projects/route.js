import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sanitizeKey } from "../../../lib/calc";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: { key: true, name: true, updatedAt: true },
  });
  return NextResponse.json(projects);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body?.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "物件名を入力してや" }, { status: 400 });
  }
  const key = sanitizeKey(name);
  if (!key) {
    return NextResponse.json({ error: "物件名が不正です" }, { status: 400 });
  }

  const project = await prisma.project.upsert({
    where: { key },
    update: { name, payload: body.payload },
    create: { key, name, payload: body.payload },
  });

  return NextResponse.json({ key: project.key, name: project.name });
}
