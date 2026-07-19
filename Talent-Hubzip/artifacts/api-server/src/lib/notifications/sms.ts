import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export async function sendSms(userId: number, message: string): Promise<void> {
  const gatewayUrl = process.env.SMS_GATEWAY_URL;
  const apiKey = process.env.SMS_API_KEY;
  const sender = process.env.SMS_SENDER ?? "Jobera";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const phone = user?.phone;

  if (!gatewayUrl || !apiKey) {
    console.log(`[sms stub] user=${userId} phone=${phone ?? "n/a"}: ${message}`);
    return;
  }

  if (!phone) {
    throw new Error("User has no phone number for SMS");
  }

  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ to: phone, from: sender, message }),
  });
  if (!res.ok) {
    throw new Error(`SMS send failed: ${res.status}`);
  }
}
