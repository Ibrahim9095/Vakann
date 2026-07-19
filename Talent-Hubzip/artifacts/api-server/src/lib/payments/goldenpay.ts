import crypto from "crypto";
import type { PaymentProvider } from "./provider";

type GoldenPayCreateResponse = {
  paymentUrl: string;
  providerRef: string;
};

export class GoldenPayProvider implements PaymentProvider {
  private merchantId: string;
  private secret: string;
  private callbackUrl: string;
  private apiUrl: string;

  constructor() {
    this.merchantId = process.env.GOLDENPAY_MERCHANT_ID ?? "";
    this.secret = process.env.GOLDENPAY_SECRET ?? "";
    this.callbackUrl = process.env.GOLDENPAY_CALLBACK_URL ?? "";
    this.apiUrl = process.env.GOLDENPAY_API_URL ?? "https://rest.goldenpay.az/v2";
  }

  private configured(): boolean {
    return Boolean(this.merchantId && this.secret && this.callbackUrl);
  }

  async createPayment(amount: number, currency: string, metadata: Record<string, unknown>) {
    const providerRef = `gp_${Date.now()}_${metadata.paymentId ?? "x"}`;
    if (!this.configured()) {
      return { providerRef, paymentUrl: null as string | null };
    }

    const res = await fetch(`${this.apiUrl}/payment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.secret}`,
      },
      body: JSON.stringify({
        merchantId: this.merchantId,
        amount,
        currency,
        callbackUrl: this.callbackUrl,
        merchantOrderId: providerRef,
        description: `Jobera payment ${metadata.paymentId ?? ""}`,
      }),
    });

    if (!res.ok) {
      throw new Error(`GoldenPay create failed: ${res.status}`);
    }

    const data = (await res.json()) as GoldenPayCreateResponse;
    return { providerRef: data.providerRef ?? providerRef, paymentUrl: data.paymentUrl };
  }

  async confirmPayment(providerRef: string) {
    if (!this.configured()) return true;

    const res = await fetch(`${this.apiUrl}/payment/status/${encodeURIComponent(providerRef)}`, {
      headers: { Authorization: `Bearer ${this.secret}` },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "paid" || data.status === "success";
  }
}

export function verifyGoldenPayCallback(payload: Record<string, unknown>, signature?: string): boolean {
  const secret = process.env.GOLDENPAY_SECRET ?? "";
  if (!secret || !signature) return false;
  const body = JSON.stringify(payload);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
