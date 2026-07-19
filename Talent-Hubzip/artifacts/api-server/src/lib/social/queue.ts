import { eq } from "drizzle-orm";
import { db, socialPostsTable, jobsTable, companiesTable } from "@workspace/db";
import { sendTelegramToChannel } from "../notifications/telegram";
import { buildJobSocialCaption, buildJobCardSvg, type JobSocialContext } from "./template";

type Channel = "instagram" | "telegram" | "linkedin";

function jobUrl(jobId: number): string {
  const base = process.env.PUBLIC_APP_URL ?? "https://jobera.az";
  return `${base.replace(/\/$/, "")}/jobs/${jobId}`;
}

async function postToInstagram(caption: string, imageSvg: string): Promise<string> {
  const token = process.env.IG_ACCESS_TOKEN ?? process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.IG_BUSINESS_ACCOUNT_ID;
  if (!token || !accountId) throw new Error("Instagram credentials not configured");

  const imageBase64 = Buffer.from(imageSvg).toString("base64");
  const createRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption,
      image_url: `data:image/svg+xml;base64,${imageBase64}`,
      access_token: token,
    }),
  });
  const createData = (await createRes.json()) as { id?: string; error?: { message: string } };
  if (!createRes.ok || !createData.id) {
    throw new Error(createData.error?.message ?? "Instagram media create failed");
  }

  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: token }),
  });
  const publishData = (await publishRes.json()) as { id?: string; error?: { message: string } };
  if (!publishRes.ok || !publishData.id) {
    throw new Error(publishData.error?.message ?? "Instagram publish failed");
  }
  return publishData.id;
}

async function postToLinkedIn(caption: string): Promise<string> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !authorUrn) throw new Error("LinkedIn credentials not configured");

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) throw new Error(data.message ?? "LinkedIn post failed");
  return data.id ?? `li_${Date.now()}`;
}

async function postToChannel(
  channel: Channel,
  ctx: JobSocialContext,
  jobId: number,
): Promise<string> {
  const caption = buildJobSocialCaption({ ...ctx, jobUrl: jobUrl(jobId) });
  const imageSvg = buildJobCardSvg(ctx);

  if (channel === "telegram") {
    await sendTelegramToChannel(`${caption}\n\n${imageSvg ? "" : ""}`);
    return `tg_${jobId}_${Date.now()}`;
  }

  if (channel === "instagram") {
    if (process.env.IG_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN) {
      return postToInstagram(caption, imageSvg);
    }
    console.log("[instagram stub]", caption);
    return `ig_stub_${jobId}_${Date.now()}`;
  }

  if (channel === "linkedin") {
    if (process.env.LINKEDIN_ACCESS_TOKEN) {
      return postToLinkedIn(caption);
    }
    console.log("[linkedin stub]", caption);
    return `li_stub_${jobId}_${Date.now()}`;
  }

  return `${channel}_stub_${jobId}`;
}

async function runSocialPost(postId: number, channel: Channel, jobId: number) {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) throw new Error("Job not found");

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, job.companyId));

  const ctx: JobSocialContext = {
    title: job.title,
    companyName: company?.name ?? "Şirkət",
    city: job.city,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
  };

  const externalPostId = await postToChannel(channel, ctx, jobId);

  await db
    .update(socialPostsTable)
    .set({ status: "posted", externalPostId, error: null, postedAt: new Date() })
    .where(eq(socialPostsTable.id, postId));
}

export async function enqueueJobSocialPosts(jobId: number, channels?: Channel[]) {
  const selected: Channel[] = channels?.length
    ? channels.filter((c): c is Channel => ["telegram", "instagram", "linkedin"].includes(c))
    : ["telegram", "instagram", "linkedin"];

  for (const channel of selected) {
    const [post] = await db
      .insert(socialPostsTable)
      .values({ jobId, channel, status: "pending" })
      .returning();

    try {
      await runSocialPost(post.id, channel, jobId);
    } catch (err) {
      await db
        .update(socialPostsTable)
        .set({
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .where(eq(socialPostsTable.id, post.id));
    }
  }
}

export async function retrySocialPost(postId: number): Promise<void> {
  const [post] = await db.select().from(socialPostsTable).where(eq(socialPostsTable.id, postId));
  if (!post) throw new Error("Social post not found");
  if (post.status !== "failed") throw new Error("Only failed posts can be retried");

  await db
    .update(socialPostsTable)
    .set({ status: "pending", error: null })
    .where(eq(socialPostsTable.id, postId));

  try {
    await runSocialPost(postId, post.channel as Channel, post.jobId);
  } catch (err) {
    await db
      .update(socialPostsTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      })
      .where(eq(socialPostsTable.id, postId));
    throw err;
  }
}

export async function getSocialPostsForJob(jobId: number) {
  return db.select().from(socialPostsTable).where(eq(socialPostsTable.jobId, jobId));
}
