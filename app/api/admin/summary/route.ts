import { NextResponse } from "next/server";
import { fallbackSummary } from "@/lib/admin-fallback";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({ include: { riskEvents: true } });
    if (sessions.length === 0) return NextResponse.json(fallbackSummary());
    const levels = ["Low", "Medium", "High", "Critical"];
    const reasons = new Map<string, number>();
    sessions.forEach((session) => session.riskEvents.forEach((event) => reasons.set(event.reason, (reasons.get(event.reason) ?? 0) + 1)));
    return NextResponse.json({
      totalSessions: sessions.length,
      highRiskSessions: sessions.filter((session) => ["High", "Critical"].includes(session.riskLevel)).length,
      blockedAttempts: sessions.filter((session) => session.riskLevel === "Critical" || session.decision.includes("Block")).length,
      fraudPreventionEstimate: sessions.filter((session) => ["High", "Critical"].includes(session.riskLevel)).length * 175000,
      riskDistribution: levels.map((level) => ({ name: level, value: sessions.filter((session) => session.riskLevel === level).length })),
      channelRisk: Array.from(new Set(sessions.map((session) => session.channel))).map((channel) => ({
        channel,
        risk: Math.round(sessions.filter((session) => session.channel === channel).reduce((sum, session) => sum + session.riskScore, 0) / sessions.filter((session) => session.channel === channel).length)
      })),
      reasonFrequency: Array.from(reasons.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 6),
      loginAnomalies: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((time, index) => ({ time, anomalies: Math.max(1, sessions.filter((_, sessionIndex) => sessionIndex % 7 === index).length) }))
    });
  } catch (error) {
    console.error("Admin summary fallback used", error);
    return NextResponse.json(fallbackSummary());
  }
}
