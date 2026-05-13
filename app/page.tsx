import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, Database, Fingerprint, LockKeyhole, Network, Radar, ShieldCheck, Smartphone } from "lucide-react";
import { AdaptiveAuthDecision } from "@/components/adaptive-auth-decision";
import { BehavioralSignalPanel } from "@/components/behavioral-signal-panel";
import { RiskScoreCard } from "@/components/risk-score-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoScenarios, demoUser } from "@/lib/demo-data";
import { scoreLoginRisk } from "@/lib/risk-engine";

const previewScenario = demoScenarios.find((scenario) => scenario.id === "new-device") ?? demoScenarios[0];
const previewResult = scoreLoginRisk(demoUser, previewScenario.signals);

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-200">
            <Radar className="h-4 w-4" /> Behavioral Risk Intelligence Layer for banks
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">
            Continuous authentication that challenges only risky banking sessions.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            TrustGuard AI simulates digital banking login and transaction journeys across Internet Banking, Mobile Banking, UPI, and other channels. It silently scores behavioral risk and triggers adaptive authentication only when explainable risk is high.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/login">Try Demo Login <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/admin">Open Analyst Dashboard</Link></Button>
          </div>
          <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            This is a hackathon prototype using simulated behavioral signals and explainable risk scoring. It does not process real banking credentials or real financial transactions.
          </div>
        </div>
        <div className="space-y-5">
          <RiskScoreCard result={previewResult} />
          <AdaptiveAuthDecision result={previewResult} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Fingerprint, title: "Silent signal collection", copy: "Typing cadence, mouse/touch behavior, device fingerprint, geo/IP, session history, and transaction context." },
            { icon: BrainCircuit, title: "Explainable hybrid AI", copy: "Transparent rule-based scoring with normalized behavioral baseline deviation and production ML upgrade path." },
            { icon: LockKeyhole, title: "Adaptive authentication", copy: "Low risk is allowed silently; high risk receives OTP/security-question/face-verification step-up." }
          ].map((item) => (
            <Card key={item.title} className="glass-panel">
              <CardHeader><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><item.icon /></div><CardTitle>{item.title}</CardTitle></CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{item.copy}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Built around India’s risk-based authentication direction.</h2>
          <p className="mt-4 text-muted-foreground leading-7">
            The product is positioned for a 2025-era digital payment authentication landscape where issuers can use additional risk-based checks beyond standard authentication depending on perceived fraud risk. It does not claim official RBI integration.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <BehavioralSignalPanel signals={previewScenario.signals} />
          <Card className="glass-panel">
            <CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5 text-primary" /> Architecture overview</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {[
                [Smartphone, "Digital channels capture behavioral telemetry during login and transfer flows."],
                [BrainCircuit, "Risk engine compares current behavior against a stored baseline using weighted, explainable features."],
                [Database, "Prisma/SQLite stores users, sessions, transactions, and risk events for analyst review."],
                [ShieldCheck, "Adaptive controls allow, monitor, step-up, or block/manual-review based on thresholds."]
              ].map(([Icon, text], index) => {
                const TypedIcon = Icon as typeof Smartphone;
                return <div key={index} className="flex gap-3 rounded-2xl border bg-background/60 p-4"><TypedIcon className="h-5 w-5 shrink-0 text-primary" /><span>{text as string}</span></div>;
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Card className="glass-panel">
          <CardContent className="grid gap-6 p-8 md:grid-cols-4">
            {[
              "Internet Banking",
              "Mobile Banking",
              "UPI platforms",
              "Open banking and other digital channels"
            ].map((channel) => <div key={channel} className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{channel}</div>)}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
