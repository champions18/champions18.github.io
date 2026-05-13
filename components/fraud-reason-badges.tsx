import { Badge } from "@/components/ui/badge";
import type { RiskContribution } from "@/lib/risk-engine";

export function FraudReasonBadges({ reasons }: { reasons: RiskContribution[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {reasons.map((reason) => (
        <Badge key={reason.key} variant={reason.points > 12 ? "critical" : reason.points > 7 ? "high" : "medium"}>
          {reason.label} · {reason.points} pts
        </Badge>
      ))}
    </div>
  );
}
