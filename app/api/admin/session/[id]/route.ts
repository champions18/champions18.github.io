import { NextResponse } from "next/server";
import { fallbackSessions } from "@/lib/admin-fallback";
import { prisma } from "@/lib/prisma";

function fallbackDetail(id: string) {
  const session = fallbackSessions().find((item) => item.id === id) ?? fallbackSessions()[0];
  return {
    signals: session.signals,
    result: session.result,
    timeline: [
      { title: "Session started", detail: `${session.channel} session opened from ${session.location}.`, time: "T+00s" },
      { title: "Behavior collected", detail: "Typing, mouse/touch, device, geo/IP, and channel signals captured silently.", time: "T+08s" },
      { title: "Risk decision", detail: `${session.result.actionLabel} with ${session.result.score}/100 risk score.`, time: "T+11s" }
    ]
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.session.findUnique({ where: { id: params.id }, include: { riskEvents: true } });
    if (!session) return NextResponse.json(fallbackDetail(params.id));
    const parsed = JSON.parse(session.explanationJson);
    return NextResponse.json({
      signals: parsed.signals,
      result: parsed.result,
      timeline: [
        { title: "Session started", detail: `${session.channel} session opened from ${session.location}.`, time: "T+00s" },
        ...session.riskEvents.map((event, index) => ({ title: event.reason, detail: event.value, time: `T+${(index + 1) * 4}s` })),
        { title: "Decision recorded", detail: session.decision, time: "T+18s" }
      ]
    });
  } catch (error) {
    console.error("Session detail fallback used", error);
    return NextResponse.json(fallbackDetail(params.id));
  }
}
