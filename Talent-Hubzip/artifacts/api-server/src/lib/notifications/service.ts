import { eq } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { sendTelegram } from "./telegram";
import { sendSms } from "./sms";

export type NotifyInput = {
  userId: number;
  type: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  channels?: ("in_app" | "telegram" | "sms")[];
};

export async function notifyUser(input: NotifyInput) {
  const channels = input.channels ?? ["in_app", "telegram", "sms"];
  const payloadStr = input.payload ? JSON.stringify(input.payload) : null;

  for (const channel of channels) {
    const [notification] = await db
      .insert(notificationsTable)
      .values({
        userId: input.userId,
        channel,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        payload: payloadStr,
        status: "pending",
      })
      .returning();

    try {
      if (channel === "telegram") {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, input.userId));
        await sendTelegram(`[Jobera] ${input.title}\n${input.body ?? ""}`, user?.telegramChatId ?? undefined);
      } else if (channel === "sms") {
        await sendSms(input.userId, `${input.title}: ${input.body ?? ""}`);
      }

      await db
        .update(notificationsTable)
        .set({ status: channel === "in_app" ? "sent" : "sent", sentAt: new Date() })
        .where(eq(notificationsTable.id, notification.id));
    } catch {
      await db
        .update(notificationsTable)
        .set({ status: "failed" })
        .where(eq(notificationsTable.id, notification.id));
    }
  }
}

export async function markNotificationRead(id: number, userId: number) {
  const [n] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!n || n.userId !== userId) return null;
  const [updated] = await db
    .update(notificationsTable)
    .set({ status: "read", readAt: new Date() })
    .where(eq(notificationsTable.id, id))
    .returning();
  return updated;
}
