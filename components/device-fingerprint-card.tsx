import { MonitorSmartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BehavioralSignals } from "@/lib/risk-engine";

export function DeviceFingerprintCard({ signals }: { signals: BehavioralSignals }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MonitorSmartphone className="h-5 w-5 text-primary" /> Device fingerprint simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-xl border bg-background/60 p-3"><span className="text-muted-foreground">Fingerprint</span><div className="font-semibold">{signals.device}</div></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-background/60 p-3"><span className="text-muted-foreground">Timezone/IP</span><div className="font-semibold">{signals.ipAddress}</div></div>
          <div className="rounded-xl border bg-background/60 p-3"><span className="text-muted-foreground">Language</span><div className="font-semibold">en-IN / hi-IN ready</div></div>
        </div>
      </CardContent>
    </Card>
  );
}
