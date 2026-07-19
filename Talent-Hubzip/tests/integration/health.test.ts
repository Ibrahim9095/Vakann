import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import healthRouter from "../../artifacts/api-server/src/routes/health";

const app = express();
app.use("/api", healthRouter);

describe("GET /api/healthz", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/api/healthz");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
