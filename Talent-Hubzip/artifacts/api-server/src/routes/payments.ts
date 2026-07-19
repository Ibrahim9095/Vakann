import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  packagesTable,
  paymentsTable,
  subscriptionsTable,
  contactRequestsTable,
  candidatesTable,
  companiesTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getPaymentProvider } from "../lib/payments/provider";
import { verifyGoldenPayCallback } from "../lib/payments/goldenpay";
import { activateSubscriptionForCandidate } from "../lib/blur";
import { notifyUser } from "../lib/notifications/service";
import { activateCompanySubscription } from "../lib/hr-limits";

const router: IRouter = Router();

function paymentProviderName() {
  return process.env.PAYMENT_PROVIDER === "goldenpay" ? "goldenpay" : "simulated";
}

async function attachProviderRef(paymentId: number, amount: number, currency: string, metadata: Record<string, unknown>) {
  const provider = getPaymentProvider();
  const result = await provider.createPayment(amount, currency, metadata);
  const [updated] = await db
    .update(paymentsTable)
    .set({ providerRef: result.providerRef })
    .where(eq(paymentsTable.id, paymentId))
    .returning();
  return { payment: updated, paymentUrl: result.paymentUrl ?? null };
}

async function fulfillPayment(paymentId: number, userId: number) {
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId));
  if (!payment || payment.userId !== userId) return null;
  if (payment.status === "paid") return payment;

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, payment.packageId));
  if (!pkg) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

  await db
    .update(paymentsTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(paymentsTable.id, paymentId));

  if (pkg.audience === "hr" && payment.companyId) {
    await activateCompanySubscription(payment.companyId, pkg.id);
    await notifyUser({
      userId,
      type: "subscription",
      title: "HR Premium aktivləşdirildi",
      body: `${pkg.name} paketi uğurla aktivləşdirildi.`,
      payload: { packageId: pkg.id, companyId: payment.companyId },
    });
    return { ...payment, status: "paid" as const, package: pkg };
  }

  const tier = pkg.tier === "vip" ? "vip" : "time_limited";

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({
      userId,
      packageId: pkg.id,
      status: "active",
      startsAt: new Date(),
      expiresAt,
    })
    .returning();

  await activateSubscriptionForCandidate(
    userId,
    tier as "vip" | "time_limited",
    expiresAt,
    payment.contactRequestId ?? undefined,
  );

  await notifyUser({
    userId,
    type: "subscription",
    title: "Abunəlik aktivləşdirildi",
    body: `${pkg.name} paketi uğurla aktivləşdirildi.`,
    payload: { subscriptionId: sub.id, packageId: pkg.id },
  });

  return { ...payment, status: "paid" as const, package: pkg, subscription: sub };
}

router.post("/payments/create", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { packageId, contactRequestId, companyId } = req.body;
  if (!packageId) {
    res.status(400).json({ error: "packageId is required" });
    return;
  }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  if (pkg.audience === "hr") {
    if (user.role !== "hr" && user.role !== "admin") {
      res.status(403).json({ error: "HR packages require HR role" });
      return;
    }
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
    if (companies.length === 0) {
      res.status(400).json({ error: "Company profile required" });
      return;
    }
    const resolvedCompanyId = companyId ?? companies[0].id;

    const [payment] = await db
      .insert(paymentsTable)
      .values({
        userId: user.id,
        packageId: pkg.id,
        companyId: resolvedCompanyId,
        amount: pkg.price,
        currency: pkg.currency,
        status: "pending",
        provider: paymentProviderName(),
      })
      .returning();

    const { payment: updated, paymentUrl } = await attachProviderRef(payment.id, pkg.price, pkg.currency, {
      paymentId: payment.id,
      userId: user.id,
      companyId: resolvedCompanyId,
    });

    res.status(201).json({ ...updated, package: pkg, paymentUrl });
    return;
  }

  const isTimePackage = pkg.tier.startsWith("time_");
  if (isTimePackage) {
    if (!contactRequestId) {
      res.status(400).json({ error: "contactRequestId is required for time packages" });
      return;
    }
    const [cr] = await db
      .select()
      .from(contactRequestsTable)
      .where(eq(contactRequestsTable.id, contactRequestId));
    if (!cr || cr.status !== "accepted_pending_payment") {
      res.status(400).json({ error: "Valid accepted contact request required for time packages" });
      return;
    }
    const [candidate] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.userId, user.id));
    if (!candidate || candidate.id !== cr.candidateId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId: user.id,
      packageId: pkg.id,
      contactRequestId: contactRequestId ?? null,
      amount: pkg.price,
      currency: pkg.currency,
      status: "pending",
      provider: paymentProviderName(),
    })
    .returning();

  const { payment: updated, paymentUrl } = await attachProviderRef(payment.id, pkg.price, pkg.currency, {
    paymentId: payment.id,
    userId: user.id,
  });

  res.status(201).json({ ...updated, package: pkg, paymentUrl });
});

router.post("/payments/callback/goldenpay", async (req, res): Promise<void> => {
  const signature = req.headers["x-goldenpay-signature"] as string | undefined;
  if (!verifyGoldenPayCallback(req.body as Record<string, unknown>, signature)) {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const { merchantOrderId, paymentId, status } = req.body as {
    merchantOrderId?: string;
    paymentId?: number;
    status?: string;
  };

  if (status !== "paid" && status !== "success") {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  let payment;
  if (paymentId) {
    [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId));
  } else if (merchantOrderId) {
    const all = await db.select().from(paymentsTable);
    payment = all.find((p) => p.providerRef === merchantOrderId);
  }

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const result = await fulfillPayment(payment.id, payment.userId);
  res.json({ ok: true, result });
});

router.post("/payments/confirm", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { paymentId } = req.body;
  if (!paymentId) {
    res.status(400).json({ error: "paymentId is required" });
    return;
  }

  const result = await fulfillPayment(paymentId, user.id);
  if (!result) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json(result);
});

router.get("/payments", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, user.id));

  const enriched = await Promise.all(
    payments.map(async (p) => {
      const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, p.packageId));
      return { ...p, package: pkg ?? null };
    }),
  );

  res.json(enriched);
});

// Legacy direct subscription — VIP only without payment flow
router.get("/packages", async (req, res): Promise<void> => {
  const { audience } = req.query;
  let packages = await db.select().from(packagesTable);
  if (audience) {
    packages = packages.filter((p) => p.audience === audience);
  }
  res.json(packages);
});

router.get("/subscriptions", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.id));
  const enriched = await Promise.all(subs.map(async (s) => {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, s.packageId));
    return { ...s, package: pkg ?? null };
  }));
  res.json(enriched);
});

router.post("/subscriptions", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { packageId, contactRequestId, paymentId } = req.body;

  if (paymentId) {
    const result = await fulfillPayment(paymentId, user.id);
    if (!result) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.status(201).json(result);
    return;
  }

  if (!packageId) {
    res.status(400).json({ error: "packageId is required" });
    return;
  }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  if (pkg.tier.startsWith("time_")) {
    res.status(400).json({
      error: "Time packages require payment. Use POST /payments/create then /payments/confirm",
      contactRequestId,
    });
    return;
  }

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      userId: user.id,
      packageId: pkg.id,
      amount: pkg.price,
      currency: pkg.currency,
      status: "pending",
      provider: "simulated",
      providerRef: `sim_vip_${Date.now()}`,
    })
    .returning();

  const result = await fulfillPayment(payment.id, user.id);
  res.status(201).json(result);
});

export default router;
