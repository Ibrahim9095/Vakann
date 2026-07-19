import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

const countResult = Promise.resolve([{ count: 42 }]);

vi.mock("@workspace/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => countResult,
        then: countResult.then.bind(countResult),
      }),
    }),
  },
  jobsTable: {},
  candidatesTable: {},
  companiesTable: {},
}));

import platformRouter from "../../artifacts/api-server/src/routes/platform";

const app = express();
app.use(platformRouter);

describe("GET /platform/stats", () => {
  it("returns platform statistics", async () => {
    const res = await request(app).get("/platform/stats");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      activeJobs: 42,
      totalCandidates: 42,
      totalCompanies: 42,
    });
  });
});
