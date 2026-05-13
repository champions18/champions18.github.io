import { NextResponse } from "next/server";
import { demoUser } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import { scoreTransactionRisk, type BehavioralSignals, type TransactionSignals } from "@/lib/risk-engine";

export async function POST(request: Request) {
  const body = await request.json();
  const signals = body.signals as BehavioralSignals;
  const transaction = body.transaction as TransactionSignals;
  const result = scoreTransactionRisk(demoUser, signals, transaction);
  let sessionId = `demo_txn_${Date.now()}`;
  let transactionId = `txn_${Date.now()}`;

  try {
    const user = await prisma.user.upsert({
      where: { customerId: demoUser.customerId },
      update: {},
      create: {
        id: demoUser.id,
        name: demoUser.name,
        customerId: demoUser.customerId,
        usualDevice: demoUser.usualDevice,
        usualLocation: demoUser.usualLocation,
        usualLoginHours: demoUser.usualLoginHours,
        baselineTypingSpeed: demoUser.baselineTypingSpeed,
        baselineMouseSpeed: demoUser.baselineMouseSpeed
      }
    });
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        channel: signals.channel,
        device: signals.device,
        location: signals.location,
        ipAddress: signals.ipAddress,
        loginTime: new Date(signals.loginTime),
        typingSpeed: signals.typingSpeed,
        backspaceRate: signals.backspaceRate,
        mouseVelocity: signals.mouseVelocity,
        clickPrecision: signals.clickPrecision,
        failedAttempts: signals.failedAttempts,
        riskScore: result.score,
        riskLevel: result.level,
        decision: result.actionLabel,
        explanationJson: JSON.stringify({ result, signals, transaction })
      }
    });
    sessionId = session.id;
    const txn = await prisma.transaction.create({
      data: {
        userId: user.id,
        sessionId,
        amount: transaction.amount,
        beneficiary: transaction.beneficiary,
        isNewBeneficiary: transaction.isNewBeneficiary,
        channel: transaction.channel,
        riskScore: result.score,
        status: result.level === "Critical" ? "Blocked" : result.level === "High" ? "Step-up required" : "Approved"
      }
    });
    transactionId = txn.id;
    await prisma.riskEvent.createMany({
      data: result.explanations.map((item) => ({
        sessionId,
        eventType: "TRANSACTION_RISK",
        severity: result.level,
        reason: item.label,
        value: item.explanation
      }))
    });
  } catch (error) {
    console.error("Demo database write skipped", error);
  }

  return NextResponse.json({ sessionId, transactionId, result });
}
