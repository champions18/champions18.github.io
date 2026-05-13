import { PrismaClient } from "@prisma/client";
import { demoScenarios, demoUser } from "../lib/demo-data";
import { scoreLoginRisk, scoreTransactionRisk } from "../lib/risk-engine";

const prisma = new PrismaClient();

async function main() {
  await prisma.riskEvent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
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

  for (const [index, scenario] of demoScenarios.entries()) {
    const result = scenario.transaction ? scoreTransactionRisk(demoUser, scenario.signals, scenario.transaction) : scoreLoginRisk(demoUser, scenario.signals);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        channel: scenario.signals.channel,
        device: scenario.signals.device,
        location: scenario.signals.location,
        ipAddress: scenario.signals.ipAddress,
        loginTime: new Date(scenario.signals.loginTime),
        typingSpeed: scenario.signals.typingSpeed,
        backspaceRate: scenario.signals.backspaceRate,
        mouseVelocity: scenario.signals.mouseVelocity,
        clickPrecision: scenario.signals.clickPrecision,
        failedAttempts: scenario.signals.failedAttempts,
        riskScore: result.score,
        riskLevel: result.level,
        decision: result.actionLabel,
        explanationJson: JSON.stringify({ result, signals: scenario.signals, transaction: scenario.transaction }),
        createdAt: new Date(Date.now() - index * 3600_000)
      }
    });

    if (scenario.transaction) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          amount: scenario.transaction.amount,
          beneficiary: scenario.transaction.beneficiary,
          isNewBeneficiary: scenario.transaction.isNewBeneficiary,
          channel: scenario.transaction.channel,
          riskScore: result.score,
          status: result.level === "Critical" ? "Blocked" : result.level === "High" ? "Step-up required" : "Approved"
        }
      });
    }

    await prisma.riskEvent.createMany({
      data: result.explanations.map((item) => ({
        sessionId: session.id,
        eventType: scenario.transaction ? "TRANSACTION_RISK" : "LOGIN_RISK",
        severity: result.level,
        reason: item.label,
        value: item.explanation
      }))
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
