import { NextResponse } from "next/server";
import { fallbackSessions } from "@/lib/admin-fallback";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({ orderBy: { createdAt: "desc" }, include: { user: true }, take: 50 });
    if (sessions.length === 0) return NextResponse.json({ sessions: fallbackSessions() });
    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        customer: session.user.name,
        channel: session.channel,
        location: session.location,
        riskScore: session.riskScore,
        riskLevel: session.riskLevel,
        decision: session.decision,
        createdAt: session.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("Admin sessions fallback used", error);
    return NextResponse.json({ sessions: fallbackSessions() });
  }
}
