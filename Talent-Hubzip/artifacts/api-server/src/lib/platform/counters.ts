import { eq } from "drizzle-orm";
import { db, platformCountersTable, INTERVIEW_CHANCES_COUNTER_KEY } from "@workspace/db";
import { broadcastSseEvent } from "../events/sse";

export async function getCounter(key: string): Promise<number> {
  const [row] = await db
    .select()
    .from(platformCountersTable)
    .where(eq(platformCountersTable.key, key));

  return row?.value ?? 0;
}

export async function incrementCounter(key: string, by = 1): Promise<number> {
  const [existing] = await db
    .select()
    .from(platformCountersTable)
    .where(eq(platformCountersTable.key, key));

  if (!existing) {
    const [created] = await db
      .insert(platformCountersTable)
      .values({ key, value: by })
      .returning();
    const value = created.value;
    if (key === INTERVIEW_CHANCES_COUNTER_KEY) {
      broadcastSseEvent("interview_chances", { value });
    }
    return value;
  }

  const next = existing.value + by;
  await db
    .update(platformCountersTable)
    .set({ value: next })
    .where(eq(platformCountersTable.key, key));

  if (key === INTERVIEW_CHANCES_COUNTER_KEY) {
    broadcastSseEvent("interview_chances", { value: next });
  }

  return next;
}

export async function getInterviewChancesCount(): Promise<number> {
  return getCounter(INTERVIEW_CHANCES_COUNTER_KEY);
}

export async function incrementInterviewChances(): Promise<number> {
  return incrementCounter(INTERVIEW_CHANCES_COUNTER_KEY, 1);
}
