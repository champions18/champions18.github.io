"use client";

import { Sparkles } from "lucide-react";
import { Select } from "@/components/ui/select";
import { demoScenarios } from "@/lib/demo-data";

export function DemoScenarioSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Demo scenario selector</div>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {demoScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
      </Select>
      <p className="mt-2 text-xs text-muted-foreground">Use this to instantly simulate normal users, suspicious devices, impossible travel, bot behavior, and account takeover attempts.</p>
    </div>
  );
}
