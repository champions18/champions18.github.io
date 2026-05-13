"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, ShieldCheck } from "lucide-react";
import { AdaptiveAuthDecision } from "@/components/adaptive-auth-decision";
import { BehavioralSignalPanel } from "@/components/behavioral-signal-panel";
import { DemoScenarioSelector } from "@/components/demo-scenario-selector";
import { RiskScoreCard } from "@/components/risk-score-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoScenarios, demoUser } from "@/lib/demo-data";
import type { RiskResult } from "@/lib/risk-engine";
import { useBehaviorSignals } from "@/hooks/use-behavior-signals";

export default function LoginPage() {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState("normal");
  const [customerId, setCustomerId] = useState(demoUser.customerId);
  const [password, setPassword] = useState("TrustGuard@123");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | undefined>();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const scenario = useMemo(() => demoScenarios.find((item) => item.id === scenarioId) ?? demoScenarios[0], [scenarioId]);
  const { signals, collectors, setFailedAttempts } = useBehaviorSignals(scenario.signals.channel);
  const activeSignals = scenarioId === "normal" ? { ...signals, failedAttempts: signals.failedAttempts } : scenario.signals;

  async function submitLogin() {
    setLoading(true);
    const response = await fetch("/api/risk/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, passwordPresent: password.length > 0, signals: activeSignals, scenarioId })
    });
    const payload = await response.json();
    setResult(payload.result);
    setSessionId(payload.sessionId);
    localStorage.setItem("trustguard:lastResult", JSON.stringify(payload.result));
    localStorage.setItem("trustguard:lastSignals", JSON.stringify(activeSignals));
    localStorage.setItem("trustguard:lastSessionId", payload.sessionId);
    setLoading(false);
  }

  function continueJourney() {
    if (!result) return;
    if (result.decision === "step_up_authentication") router.push(`/step-up?sessionId=${sessionId}&next=/banking`);
    else if (result.decision === "block_manual_review") router.push(`/step-up?sessionId=${sessionId}&blocked=true`);
    else router.push("/banking");
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <section className="space-y-5">
        <DemoScenarioSelector value={scenarioId} onChange={(id) => { setScenarioId(id); setResult(undefined); if (id === "failed-attempts") setFailedAttempts(4); }} />
        <Card className="glass-panel">
          <CardHeader>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"><Activity className="h-3 w-3" /> Behavioral authentication active</div>
            <CardTitle className="text-3xl">Digital banking login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" onPointerMove={collectors.onPointerMove} onClickCapture={collectors.onClickCapture} onTouchMove={collectors.onTouchMove}>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input id="customerId" value={customerId} onChange={(event) => setCustomerId(event.target.value)} onKeyDown={collectors.onKeyDown} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={collectors.onKeyDown} />
            </div>
            <div className="rounded-2xl border bg-background/60 p-4 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-semibold text-foreground"><Lock className="h-4 w-4" /> Demo-only authentication</div>
              Credentials are simulated. TrustGuard AI evaluates behavior and context, not real banking secrets.
            </div>
            <Button className="w-full" size="lg" onClick={submitLogin} disabled={loading}>{loading ? "Scoring session..." : "Login with behavioral risk scoring"}</Button>
            {result && <Button className="w-full" variant="outline" onClick={continueJourney}><ShieldCheck className="h-4 w-4" /> Continue based on decision</Button>}
          </CardContent>
        </Card>
      </section>
      <section className="space-y-5">
        <RiskScoreCard result={result} />
        <AdaptiveAuthDecision result={result} />
        <BehavioralSignalPanel signals={activeSignals} />
      </section>
    </main>
  );
}
