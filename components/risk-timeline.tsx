import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RiskTimeline({ events }: { events: { title: string; detail: string; time: string }[] }) {
  return (
    <Card className="glass-panel">
      <CardHeader><CardTitle>Risk timeline</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {events.map((event, index) => (
          <div key={`${event.title}-${index}`} className="relative border-l border-primary/30 pl-5">
            <div className="absolute -left-2 top-1 h-4 w-4 rounded-full bg-primary" />
            <div className="text-sm font-semibold">{event.title}</div>
            <div className="text-xs text-muted-foreground">{event.time}</div>
            <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
