import { notFound } from "next/navigation";
import { AdaptiveAuthDecision } from "@/components/adaptive-auth-decision";
import { BehavioralSignalPanel } from "@/components/behavioral-signal-panel";
import { DeviceFingerprintCard } from "@/components/device-fingerprint-card";
import { FraudReasonBadges } from "@/components/fraud-reason-badges";
import { RiskScoreCard } from "@/components/risk-score-card";
import { RiskTimeline } from "@/components/risk-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getSession(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(`${base}/api/admin/session/${id}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function SessionPage({ params }: { params: { id: string } }) {
  const data = await getSession(params.id);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-cyan-300">Investigation workspace</p>
        <h1 className="text-4xl font-black tracking-tight">Session {params.id.slice(0, 16)}</h1>
        <p className="mt-2 text-muted-foreground">Full behavioral telemetry, decision lineage, risk factors, and audit trail.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <RiskScoreCard result={data.result} />
          <AdaptiveAuthDecision result={data.result} />
          <DeviceFingerprintCard signals={data.signals} />
        </div>
        <div className="space-y-5">
          <BehavioralSignalPanel signals={data.signals} />
          <Card className="glass-panel"><CardHeader><CardTitle>Explainability panel</CardTitle></CardHeader><CardContent><FraudReasonBadges reasons={data.result.allContributions.filter((item: { points: number }) => item.points > 0)} /></CardContent></Card>
          <RiskTimeline events={data.timeline} />
        </div>
      </div>
    </main>
  );
}
