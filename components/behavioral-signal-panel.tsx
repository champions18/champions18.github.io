import { Activity, Keyboard, MapPin, MousePointer2, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BehavioralSignals } from "@/lib/risk-engine";

export function BehavioralSignalPanel({ signals }: { signals: BehavioralSignals }) {
  const items = [
    { icon: Keyboard, label: "Typing cadence", value: `${signals.typingSpeed} CPM`, sub: `${signals.dwellTime}ms dwell · ${signals.backspaceRate} backspace rate` },
    { icon: MousePointer2, label: "Mouse/touch behavior", value: `${signals.mouseVelocity} px/s`, sub: `${Math.round(signals.clickPrecision * 100)}% precision · ${Math.round(signals.pathIrregularity * 100)}% irregularity` },
    { icon: Smartphone, label: "Device fingerprint", value: signals.device, sub: `${signals.channel} · ${signals.swipeVelocity ?? 0} swipe velocity` },
    { icon: MapPin, label: "Geo/IP simulation", value: signals.location, sub: `${signals.ipAddress} · ${signals.impossibleTravel ? "Impossible travel" : "Normal travel"}` }
  ];

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Behavioral signal stream</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-background/60 p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></div>
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="mt-1 break-words text-sm text-foreground">{item.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{item.sub}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
