import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export interface SessionRow {
  id: string;
  customer: string;
  channel: string;
  location: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  decision: string;
  createdAt: string;
}

const variant = { Low: "low", Medium: "medium", High: "high", Critical: "critical" } as const;

export function SessionTable({ rows }: { rows: SessionRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Decision</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 12)}</td>
              <td className="px-4 py-3 font-medium">{row.customer}</td>
              <td className="px-4 py-3">{row.channel}</td>
              <td className="px-4 py-3">{row.location}</td>
              <td className="px-4 py-3"><Badge variant={variant[row.riskLevel]}>{row.riskScore} · {row.riskLevel}</Badge></td>
              <td className="px-4 py-3">{row.decision}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(row.createdAt)}</td>
              <td className="px-4 py-3"><Button asChild variant="outline" size="sm"><Link href={`/session/${row.id}`}>Investigate</Link></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
