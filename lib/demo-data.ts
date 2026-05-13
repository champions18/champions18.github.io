import type { BehavioralSignals, Channel, TransactionSignals, UserBaseline } from "./risk-engine";

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  badge: string;
  signals: BehavioralSignals;
  transaction?: TransactionSignals;
}

export const demoUser: UserBaseline = {
  id: "user_001",
  name: "Aarav Mehta",
  customerId: "TG1002001",
  usualDevice: "Chrome on Windows 11 · 1920x1080 · Asia/Kolkata",
  usualLocation: "Mumbai, Maharashtra",
  usualLoginHours: "8-22",
  baselineTypingSpeed: 215,
  baselineMouseSpeed: 620
};

const baseSignals: BehavioralSignals = {
  channel: "Internet Banking",
  device: demoUser.usualDevice,
  location: demoUser.usualLocation,
  ipAddress: "103.21.58.17",
  loginTime: new Date().toISOString(),
  typingSpeed: 210,
  dwellTime: 128,
  flightTime: 82,
  backspaceRate: 0.06,
  mouseVelocity: 600,
  clickPrecision: 0.94,
  pathIrregularity: 0.12,
  hesitationMs: 480,
  failedAttempts: 0,
  touchPressure: 0.42,
  swipeVelocity: 310,
  deviceRotation: 2
};

function withHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "normal",
    name: "Normal trusted user",
    badge: "Low friction",
    description: "Known device, usual Mumbai location, familiar typing and mouse dynamics.",
    signals: { ...baseSignals }
  },
  {
    id: "new-device",
    name: "Suspicious new device",
    badge: "Device mismatch",
    description: "Login arrives from a fresh Android browser and non-baseline device fingerprint.",
    signals: {
      ...baseSignals,
      channel: "Mobile Banking",
      device: "Chrome on Android 15 · 412x915 · Asia/Kolkata",
      typingSpeed: 160,
      mouseVelocity: 420,
      clickPrecision: 0.78,
      pathIrregularity: 0.32
    }
  },
  {
    id: "high-value-transfer",
    name: "High-value transfer to new beneficiary",
    badge: "Step-up expected",
    description: "Normal login becomes risky at payment time because of amount deviation and a new beneficiary.",
    signals: { ...baseSignals, channel: "UPI" },
    transaction: {
      amount: 245000,
      averageAmount: 18000,
      beneficiary: "Rohan Exports - New VPA",
      isNewBeneficiary: true,
      channel: "UPI",
      remarks: "Urgent vendor settlement"
    }
  },
  {
    id: "failed-attempts",
    name: "Repeated failed login attempts",
    badge: "Credential stuffing",
    description: "Several failed attempts precede the login, raising account takeover risk.",
    signals: {
      ...baseSignals,
      typingSpeed: 280,
      failedAttempts: 4,
      backspaceRate: 0.22,
      clickPrecision: 0.7,
      pathIrregularity: 0.44
    }
  },
  {
    id: "impossible-travel",
    name: "Impossible travel scenario",
    badge: "Critical geography",
    description: "Login appears from Singapore minutes after a trusted Mumbai session.",
    signals: {
      ...baseSignals,
      device: "Safari on macOS · 1440x900 · Asia/Singapore",
      location: "Singapore",
      ipAddress: "45.77.32.10",
      loginTime: withHour(3),
      impossibleTravel: true,
      mouseVelocity: 980,
      clickPrecision: 0.62,
      pathIrregularity: 0.72
    }
  },
  {
    id: "bot-typing",
    name: "Bot-like typing pattern",
    badge: "Automation",
    description: "Highly uniform typing cadence, low dwell time, and near-perfect speed indicate automation.",
    signals: {
      ...baseSignals,
      typingSpeed: 640,
      dwellTime: 22,
      flightTime: 12,
      backspaceRate: 0,
      mouseVelocity: 80,
      clickPrecision: 0.99,
      pathIrregularity: 0.86,
      hesitationMs: 30
    }
  },
  {
    id: "ato",
    name: "Account takeover attempt",
    badge: "Critical action",
    description: "New device, unusual location, failed attempts, odd login hour, and high-value transfer combine into critical risk.",
    signals: {
      ...baseSignals,
      channel: "Open Banking API",
      device: "Headless Chromium · 1366x768 · UTC",
      location: "Dubai, UAE",
      ipAddress: "185.220.101.42",
      loginTime: withHour(2),
      typingSpeed: 520,
      backspaceRate: 0.01,
      mouseVelocity: 110,
      clickPrecision: 0.58,
      pathIrregularity: 0.82,
      failedAttempts: 5,
      impossibleTravel: true
    },
    transaction: {
      amount: 500000,
      averageAmount: 18000,
      beneficiary: "New Crypto OTC Desk",
      isNewBeneficiary: true,
      channel: "Open Banking API",
      remarks: "Invoice clearance"
    }
  }
];

export const channels: Channel[] = ["Internet Banking", "Mobile Banking", "UPI", "Cardless ATM", "Open Banking API"];

export const recentTransactions = [
  { id: "txn_01", label: "UPI · BigBasket", amount: -1840, status: "Completed", date: "Today, 10:42" },
  { id: "txn_02", label: "Salary credit", amount: 186000, status: "Completed", date: "Yesterday" },
  { id: "txn_03", label: "NEFT · Home rent", amount: -52000, status: "Completed", date: "08 May" },
  { id: "txn_04", label: "UPI · Electricity", amount: -3410, status: "Completed", date: "06 May" }
];

export const mockSessionRows = demoScenarios.map((scenario, index) => ({
  id: `seed_session_${index + 1}`,
  user: demoUser.name,
  channel: scenario.signals.channel,
  device: scenario.signals.device,
  location: scenario.signals.location,
  createdAt: new Date(Date.now() - index * 3600_000).toISOString(),
  scenario: scenario.name
}));
