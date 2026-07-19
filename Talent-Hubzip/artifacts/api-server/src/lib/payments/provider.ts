import type { Payment } from "@workspace/db";

export interface PaymentProvider {
  createPayment(amount: number, currency: string, metadata: Record<string, unknown>): Promise<{ providerRef: string; paymentUrl?: string | null }>;
  confirmPayment(providerRef: string): Promise<boolean>;
}

export class SimulatedPaymentProvider implements PaymentProvider {
  async createPayment(_amount: number, _currency: string, metadata: Record<string, unknown>) {
    const providerRef = `sim_${Date.now()}_${metadata.paymentId ?? "x"}`;
    return { providerRef };
  }

  async confirmPayment(_providerRef: string) {
    return true;
  }
}

let provider: PaymentProvider = new SimulatedPaymentProvider();

export function setPaymentProvider(p: PaymentProvider) {
  provider = p;
}

export function getPaymentProvider(): PaymentProvider {
  return provider;
}

export async function processPaidPayment(payment: Payment) {
  const confirmed = await provider.confirmPayment(payment.providerRef ?? "");
  return confirmed;
}
