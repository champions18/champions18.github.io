"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, IndianRupee, ShieldAlert, Users } from "lucide-react";
import { ChannelRiskChart } from "@/components/charts/channel-risk-chart";
import { LoginAnomalyChart, ReasonFrequencyChart, RiskDistributionChart } from "@/components/charts/admin-charts";
import { SessionTable, type SessionRow } from "@/components/session-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";

interface Summary {
  totalSessions: number;
  highRiskSessions: number;
  blockedAttempts: number;
  fraudPreventionEstimate: number;
  riskDistribution: { name: string; value: number }[];
  channelRisk: { channel: string; risk: number }[];
  reasonFrequency: { reason: string; count: number }[];
  loginAnomalies: { time: string; anomalies: number }[];
}

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/summary").then((res) => res.json()).then(setSummary);
    fetch("/api/admin/sessions").then((res) => res.json()).then((payload) => setSessions(payload.sessions));
  }, []);

  const metrics = [
    { label: "Total sessions", value: summary?.totalSessions ?? 0, icon: Users },
    { label: "High-risk sessions", value: summary?.highRiskSessions ?? 0, icon: ShieldAlert },
    { label: "Blocked attempts", value: summary?.blockedAttempts ?? 0, icon: Ban },
    { label: "Fraud-prevention estimate", value: formatINR(summary?.fraudPreventionEstimate ?? 0), icon: IndianRupee }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-cyan-300">Security operations center</p>
        <h1 className="text-4xl font-black tracking-tight">TrustGuard AI analyst dashboard</h1>
        <p className="mt-2 text-muted-foreground">Investigate risky digital banking sessions, channel anomalies, and explainable risk reasons in one place.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        {metrics.map((metric) => <Card key={metric.label} className="glass-panel"><CardHeader><metric.icon className="h-6 w-6 text-primary" /><CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle></CardHeader><CardContent className="text-3xl font-black">{metric.value}</CardContent></Card>)}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="glass-panel"><CardHeader><CardTitle>Risk score distribution</CardTitle></CardHeader><CardContent>{summary && <RiskDistributionChart data={summary.riskDistribution} />}</CardContent></Card>
        <Card className="glass-panel"><CardHeader><CardTitle>Channel-wise risk</CardTitle></CardHeader><CardContent>{summary && <ChannelRiskChart data={summary.channelRisk} />}</CardContent></Card>
        <Card className="glass-panel"><CardHeader><CardTitle>Risk reasons frequency</CardTitle></CardHeader><CardContent>{summary && <ReasonFrequencyChart data={summary.reasonFrequency} />}</CardContent></Card>
        <Card className="glass-panel"><CardHeader><CardTitle>Login anomalies over time</CardTitle></CardHeader><CardContent>{summary && <LoginAnomalyChart data={summary.loginAnomalies} />}</CardContent></Card>
      </div>
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-lg font-bold"><AlertTriangle className="h-5 w-5 text-amber-300" /> Live risk events</div>
        <div className="overflow-x-auto"><SessionTable rows={sessions} /></div>
      </div>
    </main>
  );
}
