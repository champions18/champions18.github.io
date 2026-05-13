"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RiskDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
          {data.map((_, i) => <Cell key={i} fill={["#10b981", "#f59e0b", "#f97316", "#ef4444"][i]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ReasonFrequencyChart({ data }: { data: { reason: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis type="number" />
        <YAxis dataKey="reason" type="category" width={120} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#2563eb" radius={[0, 10, 10, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LoginAnomalyChart({ data }: { data: { time: string; anomalies: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="anomalies" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
