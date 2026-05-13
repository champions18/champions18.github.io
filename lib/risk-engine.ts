export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type Decision = "allow_silently" | "allow_monitor" | "step_up_authentication" | "block_manual_review";

export type Channel = "Internet Banking" | "Mobile Banking" | "UPI" | "Cardless ATM" | "Open Banking API";

export interface UserBaseline {
  id: string;
  name: string;
  customerId: string;
  usualDevice: string;
  usualLocation: string;
  usualLoginHours: string;
  baselineTypingSpeed: number;
  baselineMouseSpeed: number;
}

export interface BehavioralSignals {
  channel: Channel;
  device: string;
  location: string;
  ipAddress: string;
  loginTime: string;
  typingSpeed: number;
  dwellTime: number;
  flightTime: number;
  backspaceRate: number;
  mouseVelocity: number;
  clickPrecision: number;
  pathIrregularity: number;
  hesitationMs: number;
  failedAttempts: number;
  touchPressure?: number;
  swipeVelocity?: number;
  deviceRotation?: number;
  impossibleTravel?: boolean;
}

export interface TransactionSignals {
  amount: number;
  averageAmount: number;
  beneficiary: string;
  isNewBeneficiary: boolean;
  channel: Channel;
  remarks?: string;
}

export interface RiskContribution {
  key: string;
  label: string;
  value: number;
  weight: number;
  points: number;
  explanation: string;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  decision: Decision;
  actionLabel: string;
  explanations: RiskContribution[];
  allContributions: RiskContribution[];
  modelVersion: string;
}

const MODEL_VERSION = "hybrid-rules-v1.0";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function hourFromDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().getHours() : date.getHours();
}

function parseHourWindow(window: string) {
  const [start, end] = window.split("-").map((part) => Number.parseInt(part, 10));
  return { start: Number.isFinite(start) ? start : 8, end: Number.isFinite(end) ? end : 22 };
}

export function riskLevel(score: number): RiskLevel {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
}

export function recommendedDecision(level: RiskLevel): { decision: Decision; actionLabel: string } {
  if (level === "Low") return { decision: "allow_silently", actionLabel: "Allow silently" };
  if (level === "Medium") return { decision: "allow_monitor", actionLabel: "Allow + monitor" };
  if (level === "High") return { decision: "step_up_authentication", actionLabel: "Step-up authentication" };
  return { decision: "block_manual_review", actionLabel: "Block / freeze / manual review" };
}

function channelRisk(channel: Channel) {
  const map: Record<Channel, number> = {
    "Internet Banking": 0.25,
    "Mobile Banking": 0.2,
    UPI: 0.45,
    "Cardless ATM": 0.7,
    "Open Banking API": 0.55
  };
  return map[channel] ?? 0.35;
}

function makeContribution(key: string, label: string, value: number, weight: number, explanation: string): RiskContribution {
  return { key, label, value: clamp(value), weight, points: Math.round(clamp(value) * weight), explanation };
}

export function scoreLoginRisk(user: UserBaseline, signals: BehavioralSignals): RiskResult {
  const typingAnomaly = clamp(Math.abs(signals.typingSpeed - user.baselineTypingSpeed) / Math.max(user.baselineTypingSpeed, 1));
  const mouseAnomaly = clamp(Math.abs(signals.mouseVelocity - user.baselineMouseSpeed) / Math.max(user.baselineMouseSpeed, 1));
  const { start, end } = parseHourWindow(user.usualLoginHours);
  const hour = hourFromDate(signals.loginTime);
  const timeAnomaly = hour < start || hour > end ? 1 : 0;
  const deviceMismatch = signals.device === user.usualDevice ? 0 : 1;
  const locationAnomaly = signals.location === user.usualLocation ? 0 : signals.impossibleTravel ? 1 : 0.75;
  const failedAttemptsRisk = clamp(signals.failedAttempts / 5);
  const touchMouseComposite = clamp((mouseAnomaly + signals.pathIrregularity + (1 - signals.clickPrecision)) / 3);

  // Explainable weighted formula requested by the problem statement. Each feature is normalized to 0..1, multiplied
  // by its transparent weight, then summed into a 0..100 risk score so judges can audit every decision.
  // riskScore = deviceRisk * 15 + locationRisk * 15 + typingAnomaly * 15 + mouseAnomaly * 10
  //   + failedAttemptsRisk * 10 + transactionAmountRisk * 15 + newBeneficiaryRisk * 10
  //   + channelRisk * 5 + timeAnomalyRisk * 5
  const contributions = [
    makeContribution("deviceRisk", "Device mismatch", deviceMismatch, 15, deviceMismatch ? `Current device (${signals.device}) differs from usual device (${user.usualDevice}).` : "Device fingerprint matches the behavioral baseline."),
    makeContribution("locationRisk", "Location anomaly", locationAnomaly, 15, locationAnomaly ? `Login location ${signals.location} differs from usual location ${user.usualLocation}.` : "Login location matches the usual city."),
    makeContribution("typingAnomaly", "Typing pattern deviation", typingAnomaly, 15, `Typing speed is ${signals.typingSpeed} CPM vs baseline ${user.baselineTypingSpeed} CPM.`),
    makeContribution("mouseAnomaly", "Mouse/touch pattern deviation", touchMouseComposite, 10, `Mouse/touch dynamics show velocity ${signals.mouseVelocity}, precision ${Math.round(signals.clickPrecision * 100)}%, and path irregularity ${Math.round(signals.pathIrregularity * 100)}%.`),
    makeContribution("failedAttemptsRisk", "Multiple failed attempts", failedAttemptsRisk, 10, `${signals.failedAttempts} failed login attempt(s) observed before successful authentication.`),
    makeContribution("transactionAmountRisk", "High transaction amount", 0, 15, "No transaction amount evaluated during login."),
    makeContribution("newBeneficiaryRisk", "New beneficiary", 0, 10, "No beneficiary evaluated during login."),
    makeContribution("channelRisk", "Channel risk", channelRisk(signals.channel), 5, `${signals.channel} has a channel-specific risk prior.`),
    makeContribution("timeAnomalyRisk", "Unusual login time", timeAnomaly, 5, timeAnomaly ? `Login at ${hour}:00 is outside usual ${user.usualLoginHours}.` : "Login time is within usual hours.")
  ];

  if (signals.impossibleTravel) {
    contributions.push(makeContribution("impossibleTravel", "Impossible travel simulation", 1, 10, "Session is marked as impossible travel from the previous trusted location."));
  }

  return finalize(contributions);
}

export function scoreTransactionRisk(user: UserBaseline, signals: BehavioralSignals, transaction: TransactionSignals): RiskResult {
  const login = scoreLoginRisk(user, signals).allContributions.filter((item) => !["transactionAmountRisk", "newBeneficiaryRisk"].includes(item.key));
  const amountDeviation = clamp((transaction.amount - transaction.averageAmount) / Math.max(transaction.averageAmount * 5, 1));
  const newBeneficiaryRisk = transaction.isNewBeneficiary ? 1 : 0;
  const transactionContributions = [
    makeContribution("transactionAmountRisk", "High transaction amount", amountDeviation, 15, `${transaction.amount.toLocaleString("en-IN")} requested vs usual average ${transaction.averageAmount.toLocaleString("en-IN")}.`),
    makeContribution("newBeneficiaryRisk", "New beneficiary", newBeneficiaryRisk, 10, transaction.isNewBeneficiary ? `${transaction.beneficiary} is not in the trusted beneficiary list.` : "Beneficiary is known and previously used."),
    makeContribution("channelRisk", "Channel risk", channelRisk(transaction.channel), 5, `${transaction.channel} selected for this transaction.`)
  ];

  const withoutDuplicateChannel = login.filter((item) => item.key !== "channelRisk");
  return finalize([...withoutDuplicateChannel, ...transactionContributions]);
}

function finalize(contributions: RiskContribution[]): RiskResult {
  const score = Math.max(0, Math.min(100, Math.round(contributions.reduce((sum, item) => sum + item.points, 0))));
  const level = riskLevel(score);
  const decision = recommendedDecision(level);
  const explanations = [...contributions]
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return {
    score,
    level,
    decision: decision.decision,
    actionLabel: decision.actionLabel,
    explanations,
    allContributions: contributions.sort((a, b) => b.points - a.points),
    modelVersion: MODEL_VERSION
  };
}
