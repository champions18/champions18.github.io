import Link from "next/link";
import { ArrowUpRight, BadgeIndianRupee, Landmark, PlusCircle, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentTransactions } from "@/lib/demo-data";
import { formatINR } from "@/lib/utils";

export default function BankingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Demo customer dashboard</p>
          <h1 className="text-4xl font-black tracking-tight">Welcome back, Aarav</h1>
          <p className="mt-2 text-muted-foreground">Low-risk sessions move silently. Risky actions are challenged only when needed.</p>
        </div>
        <Button asChild><Link href="/transfer">Start secure transfer <ArrowUpRight className="h-4 w-4" /></Link></Button>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Savings balance", value: formatINR(1286500), icon: Landmark, tone: "text-blue-300" },
          { label: "UPI daily limit", value: formatINR(100000), icon: Smartphone, tone: "text-cyan-300" },
          { label: "Fraud shield status", value: "Active", icon: BadgeIndianRupee, tone: "text-emerald-300" }
        ].map((item) => (
          <Card key={item.label} className="glass-panel"><CardHeader><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ${item.tone}`}><item.icon /></div><CardTitle>{item.label}</CardTitle></CardHeader><CardContent className="text-3xl font-black">{item.value}</CardContent></Card>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.7fr]">
        <Card className="glass-panel">
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between rounded-2xl border bg-background/60 p-4">
                <div><div className="font-semibold">{txn.label}</div><div className="text-sm text-muted-foreground">{txn.date} · {txn.status}</div></div>
                <div className={txn.amount > 0 ? "font-bold text-emerald-300" : "font-bold"}>{formatINR(txn.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild size="lg"><Link href="/transfer"><Send className="h-4 w-4" /> UPI / fund transfer</Link></Button>
            <Button variant="outline" size="lg"><PlusCircle className="h-4 w-4" /> Beneficiary management</Button>
            <Button asChild variant="outline" size="lg"><Link href="/admin">View security analytics</Link></Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
