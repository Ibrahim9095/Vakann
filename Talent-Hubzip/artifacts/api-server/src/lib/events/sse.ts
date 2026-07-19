import type { Response } from "express";

type SseClient = {
  id: number;
  res: Response;
};

let clientId = 0;
const clients = new Map<number, SseClient>();

export function addSseClient(res: Response): number {
  const id = ++clientId;
  clients.set(id, { id, res });
  return id;
}

export function removeSseClient(id: number) {
  clients.delete(id);
}

export function broadcastSseEvent(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}
