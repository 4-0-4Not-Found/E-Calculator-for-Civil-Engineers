"use client";

import { useEffect } from "react";

export function HydrationDebugProbe() {
  useEffect(() => {
    // #region agent log
    try {
      try {
        const img = new Image();
        img.src = `/api/agent-log?runId=img-post&message=client%20img%20beacon&location=src/app/HydrationDebugProbe.tsx:img&ts=${Date.now()}`;
      } catch {}

      const html = document.documentElement;
      const body = document.body;
      const htmlAttrs = html ? html.getAttributeNames() : [];
      const bodyAttrs = body ? body.getAttributeNames() : [];

      fetch(
        "/api/agent-log",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "fd44da",
            runId: "post",
            hypothesisId: "H2",
            location: "src/app/HydrationDebugProbe.tsx:useEffect",
            message: "Post-hydration html/body attributes",
            data: {
              htmlAttrs,
              bodyAttrs,
              hasKnownExtAttrs: {
                qb: htmlAttrs.includes("data-qb-installed"),
                grammarly:
                  bodyAttrs.includes("data-gr-ext-installed") ||
                  bodyAttrs.includes("data-new-gr-c-s-check-loaded"),
              },
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
    } catch {}
    // #endregion agent log
  }, []);

  return null;
}

