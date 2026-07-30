"use client";

import { useEffect } from "react";

/**
 * Replaces the entire document when the root layout itself fails, so it can't
 * rely on any provider, font variable or design token being available.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            MindCareAI couldn&apos;t start
          </h1>
          <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Something failed before the app finished loading. Your data on this device is
            unaffected. Reload to try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
