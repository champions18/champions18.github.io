import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskResult } from "@/lib/risk-engine";

const levelVariant = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical"
} as const;

export function RiskScoreCard({ result, title = "Behavioral risk score" }: { result?: RiskResult; title?: string }) {
  const score = result?.score ?? 0;
  const color = score <= 30 ? "text-emerald-500" : score <= 60 ? "text-amber-500" : score <= 80 ? "text-orange-500" : "text-red-500";

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {result ? <Badge variant={levelVariant[result.level]}>{result.level}</Badge> : <Badge variant="secondary">Awaiting score</Badge>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <div className="relative grid h-32 w-32 place-items-center rounded-full bg-muted">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(currentColor ${score * 3.6}deg, hsl(var(--muted)) 0deg)` }}
            />
            <div className="absolute inset-3 rounded-full bg-card" />
            <div className={`relative text-4xl font-black ${color}`}>{score}</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {result?.level === "Low" ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
              <span>{result?.actionLabel ?? "Submit a demo scenario to calculate risk"}</span>
            </div>
            <div className="space-y-2">
              {(result?.explanations ?? []).map((item) => (
                <div key={item.key} className="rounded-xl border bg-background/60 p-3 text-sm">
                  <div className="flex justify-between font-semibold"><span>{item.label}</span><span>{item.points} pts</span></div>
                  <p className="mt-1 text-muted-foreground">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
