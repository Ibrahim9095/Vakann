import { describe, it, expect } from "vitest";
import {
  SimulatedPaymentProvider,
  getPaymentProvider,
  setPaymentProvider,
  processPaidPayment,
} from "../../../artifacts/api-server/src/lib/payments/provider";

describe("SimulatedPaymentProvider", () => {
  it("creates a provider reference", async () => {
    const provider = new SimulatedPaymentProvider();
    const { providerRef } = await provider.createPayment(29.99, "AZN", {
      paymentId: 42,
    });

    expect(providerRef).toMatch(/^sim_\d+_42$/);
  });

  it("confirms payments successfully", async () => {
    const provider = new SimulatedPaymentProvider();
    const { providerRef } = await provider.createPayment(10, "AZN", {});
    expect(await provider.confirmPayment(providerRef)).toBe(true);
  });
});

describe("payment provider registry", () => {
  it("uses simulated provider by default", () => {
    expect(getPaymentProvider()).toBeInstanceOf(SimulatedPaymentProvider);
  });

  it("allows swapping providers", async () => {
    const custom = {
      createPayment: async () => ({ providerRef: "custom_ref" }),
      confirmPayment: async () => false,
    };
    setPaymentProvider(custom);
    expect(getPaymentProvider()).toBe(custom);

    const result = await processPaidPayment({
      providerRef: "custom_ref",
    } as never);
    expect(result).toBe(false);

    setPaymentProvider(new SimulatedPaymentProvider());
  });
});
