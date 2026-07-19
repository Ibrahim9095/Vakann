import app from "./app";
import { logger } from "./lib/logger";
import { startSubscriptionExpiryJob } from "./jobs/expire-subscriptions";
import { connectRedis, disconnectRedis } from "./lib/session/redis";
import { setPaymentProvider, SimulatedPaymentProvider } from "./lib/payments/provider";
import { GoldenPayProvider } from "./lib/payments/goldenpay";

if (process.env.PAYMENT_PROVIDER === "goldenpay") {
  setPaymentProvider(new GoldenPayProvider());
} else {
  setPaymentProvider(new SimulatedPaymentProvider());
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    await connectRedis();
  } catch (err) {
    logger.error({ err }, "Failed to connect to Redis");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    startSubscriptionExpiryJob();
    logger.info({ port }, "Server listening");
  });
}

process.on("SIGTERM", () => {
  void disconnectRedis().then(() => process.exit(0));
});

void start();
