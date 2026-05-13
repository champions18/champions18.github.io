import { AlertTriangle, CheckCircle2, LockKeyhole, ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskResult } from "@/lib/risk-engine";

export function AdaptiveAuthDecision({ result }: { result?: RiskResult }) {
  const Icon = result?.level === "Critical" ? ShieldX : result?.level === "High" ? LockKeyhole : result?.level === "Medium" ? AlertTriangle : CheckCircle2;
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Adaptive authentication decision</CardTitle>
      </CardHeader>
      <CardContent className="flex items-start gap-4">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" /></div>
        <div>
          <div className="text-xl font-bold">{result?.actionLabel ?? "Awaiting behavioral score"}</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {result
              ? "TrustGuard AI challenges only when risk is meaningful, preserving low-friction journeys for trusted users while escalating high-risk sessions."
              : "Submit login or transfer details to see the risk-based decision."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
