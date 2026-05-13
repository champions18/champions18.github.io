"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, HelpCircle, KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StepUpPage() {
  const [query, setQuery] = useState({ blocked: false, next: "/banking", sessionId: "latest" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery({
      blocked: params.get("blocked") === "true",
      next: params.get("next") ?? "/banking",
      sessionId: params.get("sessionId") ?? "latest"
    });
  }, []);

  const { blocked, next, sessionId } = query;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="border-b bg-white/5">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-300"><ShieldAlert /></div>
          <CardTitle className="text-4xl">{blocked ? "Manual review required" : "Adaptive authentication required"}</CardTitle>
          <p className="text-muted-foreground">Session {sessionId.slice(0, 16)} exceeded TrustGuard AI risk thresholds. Extra verification protects the customer without challenging every low-risk payment.</p>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: KeyRound, title: "OTP simulation", copy: "Send a demo OTP to the registered mobile number." },
              { icon: HelpCircle, title: "Security question", copy: "Ask a known customer-specific verification question." },
              { icon: Camera, title: "Face verification", copy: "Placeholder for liveness and face match provider integration." }
            ].map((item) => <div key={item.title} className="rounded-2xl border bg-background/60 p-4"><item.icon className="mb-3 h-6 w-6 text-primary" /><div className="font-semibold">{item.title}</div><p className="mt-2 text-sm text-muted-foreground">{item.copy}</p></div>)}
          </div>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            Why? The explainable engine found top risk drivers such as new device/location, unusual typing or pointer behavior, high amount, new beneficiary, failed attempts, impossible travel, or risky channel.
          </div>
          <div className="flex flex-wrap gap-3">
            {!blocked && <Button asChild><Link href={next}>Approve demo verification</Link></Button>}
            <Button asChild variant="outline"><Link href="/admin">Send to analyst dashboard</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
