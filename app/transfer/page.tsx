"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Send } from "lucide-react";
import { AdaptiveAuthDecision } from "@/components/adaptive-auth-decision";
import { BehavioralSignalPanel } from "@/components/behavioral-signal-panel";
import { DemoScenarioSelector } from "@/components/demo-scenario-selector";
import { RiskScoreCard } from "@/components/risk-score-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { channels, demoScenarios } from "@/lib/demo-data";
import type { Channel, RiskResult, TransactionSignals } from "@/lib/risk-engine";

export default function TransferPage() {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState("high-value-transfer");
  const scenario = useMemo(() => demoScenarios.find((item) => item.id === scenarioId) ?? demoScenarios[2], [scenarioId]);
  const defaultTxn: TransactionSignals = scenario.transaction ?? { amount: 25000, averageAmount: 18000, beneficiary: "Priya Sharma", isNewBeneficiary: false, channel: scenario.signals.channel, remarks: "Family transfer" };
  const [amount, setAmount] = useState(defaultTxn.amount);
  const [beneficiary, setBeneficiary] = useState(defaultTxn.beneficiary);
  const [channel, setChannel] = useState<Channel>(defaultTxn.channel);
  const [isNewBeneficiary, setIsNewBeneficiary] = useState(defaultTxn.isNewBeneficiary);
  const [remarks, setRemarks] = useState(defaultTxn.remarks ?? "");
  const [result, setResult] = useState<RiskResult | undefined>();
  const [sessionId, setSessionId] = useState<string | undefined>();

  function changeScenario(id: string) {
    setScenarioId(id);
    const selected = demoScenarios.find((item) => item.id === id) ?? demoScenarios[2];
    const txn: TransactionSignals = selected.transaction ?? { amount: 25000, averageAmount: 18000, beneficiary: "Priya Sharma", isNewBeneficiary: false, channel: selected.signals.channel, remarks: "Family transfer" };
    setAmount(txn.amount);
    setBeneficiary(txn.beneficiary);
    setChannel(txn.channel);
    setIsNewBeneficiary(txn.isNewBeneficiary);
    setRemarks(txn.remarks ?? "");
    setResult(undefined);
  }

  async function scoreTransfer() {
    const response = await fetch("/api/risk/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId,
        signals: { ...scenario.signals, channel },
        transaction: { amount, averageAmount: 18000, beneficiary, isNewBeneficiary, channel, remarks }
      })
    });
    const payload = await response.json();
    setResult(payload.result);
    setSessionId(payload.sessionId);
    localStorage.setItem("trustguard:lastResult", JSON.stringify(payload.result));
    localStorage.setItem("trustguard:lastSignals", JSON.stringify({ ...scenario.signals, channel }));
    localStorage.setItem("trustguard:lastSessionId", payload.sessionId);
  }

  function finalAction() {
    if (!result) return;
    if (result.decision === "step_up_authentication") router.push(`/step-up?sessionId=${sessionId}&next=/banking`);
    else if (result.decision === "block_manual_review") router.push(`/step-up?sessionId=${sessionId}&blocked=true`);
    else router.push("/banking");
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <section className="space-y-5">
        <DemoScenarioSelector value={scenarioId} onChange={changeScenario} />
        <Card className="glass-panel">
          <CardHeader><CardTitle className="text-3xl">Risk-scored transfer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>
              <div className="space-y-2"><Label>Channel</Label><Select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>{channels.map((item) => <option key={item}>{item}</option>)}</Select></div>
            </div>
            <div className="space-y-2"><Label>Beneficiary</Label><Input value={beneficiary} onChange={(event) => setBeneficiary(event.target.value)} /></div>
            <label className="flex items-center gap-2 rounded-xl border bg-background/60 p-3 text-sm"><input type="checkbox" checked={isNewBeneficiary} onChange={(event) => setIsNewBeneficiary(event.target.checked)} /> New beneficiary</label>
            <div className="space-y-2"><Label>Remarks</Label><Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} /></div>
            <Button className="w-full" size="lg" onClick={scoreTransfer}><Send className="h-4 w-4" /> Score transaction before execution</Button>
            {result && <Button className="w-full" variant="outline" onClick={finalAction}>Continue adaptive flow <ArrowRight className="h-4 w-4" /></Button>}
          </CardContent>
        </Card>
      </section>
      <section className="space-y-5">
        <RiskScoreCard result={result} title="Transaction risk score" />
        <AdaptiveAuthDecision result={result} />
        <BehavioralSignalPanel signals={{ ...scenario.signals, channel }} />
      </section>
    </main>
  );
}
