import { Router, type IRouter } from "express";
import { addSseClient, removeSseClient } from "../lib/events/sse";

const router: IRouter = Router();

router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const id = addSseClient(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on("close", () => {
    removeSseClient(id);
  });
});

export default router;
