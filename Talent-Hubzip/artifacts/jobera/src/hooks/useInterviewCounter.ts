import { useEffect, useState } from "react";

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export function useInterviewCounter() {
  const [value, setValue] = useState<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;

    fetch(`${BASE}/platform/counters/interview-chances`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.value === "number") setValue(data.value);
        setReady(true);
      })
      .catch(() => setReady(true));

    try {
      es = new EventSource(`${BASE}/events`);
      es.addEventListener("interview_chances", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data);
          if (typeof data.value === "number") setValue(data.value);
        } catch {
          // ignore parse errors
        }
      });
    } catch {
      // SSE not available
    }

    return () => {
      es?.close();
    };
  }, []);

  return { value, ready };
}
