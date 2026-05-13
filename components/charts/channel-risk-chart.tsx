"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ChannelRiskChart({ data }: { data: { channel: string; risk: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="risk" radius={[12, 12, 0, 0]}>
          {data.map((_, index) => <Cell key={index} fill={["#2563eb", "#0891b2", "#f59e0b", "#ef4444", "#7c3aed"][index % 5]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
