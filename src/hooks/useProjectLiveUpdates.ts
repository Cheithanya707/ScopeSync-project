"use client";

import { useEffect, useRef } from "react";
import { API_TOKEN_KEY } from "@/lib/apiClient";
import { getFreshFirebaseIdToken } from "@/lib/firebaseClient";

export interface ProjectLiveEvent {
  type: string;
  projectId?: string;
  action?: string;
  summary?: string;
  entityId?: string;
}

/**
 * Subscribes to the project's Server-Sent Events stream (sent with the Authorization header,
 * which the browser EventSource cannot do) and reconnects with backoff.
 */
export function useProjectLiveUpdates(projectId: string | undefined, onEvent: (event: ProjectLiveEvent) => void): void {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    const base = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000").replace(/\/+$/, "");

    const run = async () => {
      let delay = 2000;
      while (!controller.signal.aborted) {
        try {
          const token = await getFreshFirebaseIdToken() ?? window.localStorage.getItem(API_TOKEN_KEY);
          if (!token) return;
          const response = await fetch(`${base}/api/scope/projects/${encodeURIComponent(projectId)}/events`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) throw new Error("stream unavailable");
          delay = 2000;
          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
          let buffer = "";
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            let boundary = buffer.indexOf("\n\n");
            while (boundary >= 0) {
              const block = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              boundary = buffer.indexOf("\n\n");
              const type = /^event: (.+)$/m.exec(block)?.[1];
              const data = /^data: (.+)$/m.exec(block)?.[1];
              if (!type || !data || type === "ready") continue;
              try {
                handler.current({ ...(JSON.parse(data) as ProjectLiveEvent), type });
              } catch {
                // Ignore a malformed event and keep listening.
              }
            }
          }
        } catch {
          if (controller.signal.aborted) return;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 30000);
      }
    };
    void run();
    return () => controller.abort();
  }, [projectId]);
}
