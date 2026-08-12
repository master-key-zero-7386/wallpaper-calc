import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request, { params }) {
  const project = await prisma.project.findUnique({ where: { key: params.key } });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ key: project.key, name: project.name, payload: project.payload });
}

export async function DELETE(request, { params }) {
  await prisma.project.delete({ where: { key: params.key } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
