import { demoScenarios, demoUser } from "@/lib/demo-data";
import { scoreLoginRisk, scoreTransactionRisk } from "@/lib/risk-engine";

export function fallbackSessions() {
  return demoScenarios.map((scenario, index) => {
    const result = scenario.transaction ? scoreTransactionRisk(demoUser, scenario.signals, scenario.transaction) : scoreLoginRisk(demoUser, scenario.signals);
    return {
      id: `seed_session_${index + 1}`,
      customer: demoUser.name,
      channel: scenario.signals.channel,
      location: scenario.signals.location,
      riskScore: result.score,
      riskLevel: result.level,
      decision: result.actionLabel,
      createdAt: new Date(Date.now() - index * 3600_000).toISOString(),
      signals: scenario.signals,
      result
    };
  });
}

export function fallbackSummary() {
  const sessions = fallbackSessions();
  const levels = ["Low", "Medium", "High", "Critical"];
  const reasons = new Map<string, number>();
  sessions.forEach((session) => session.result.explanations.forEach((item) => reasons.set(item.label, (reasons.get(item.label) ?? 0) + 1)));
  return {
    totalSessions: sessions.length,
    highRiskSessions: sessions.filter((session) => ["High", "Critical"].includes(session.riskLevel)).length,
    blockedAttempts: sessions.filter((session) => session.riskLevel === "Critical").length,
    fraudPreventionEstimate: 980000,
    riskDistribution: levels.map((level) => ({ name: level, value: sessions.filter((session) => session.riskLevel === level).length })),
    channelRisk: Array.from(new Set(sessions.map((session) => session.channel))).map((channel) => ({
      channel,
      risk: Math.round(sessions.filter((session) => session.channel === channel).reduce((sum, session) => sum + session.riskScore, 0) / sessions.filter((session) => session.channel === channel).length)
    })),
    reasonFrequency: Array.from(reasons.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    loginAnomalies: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((time, index) => ({ time, anomalies: [1, 2, 1, 4, 3, 5, 2][index] }))
  };
}
