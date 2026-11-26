import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { siteName, siteUrl } from "@/lib/site";

export const maxDuration = 20;

let fontPromise: Promise<ArrayBuffer> | null = null;

function loadOgFont() {
  fontPromise ??= readFile(
    path.join(process.cwd(), "app/og/ChironGoRoundTC-450BK.ttf"),
  ).then(
    (buffer) =>
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer,
  );
  return fontPromise;
}

function clampParam(value: string | null, max: number): string {
  const text = value?.trim() || "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clampParam(searchParams.get("title"), 120) || siteName;
  const description = clampParam(searchParams.get("description"), 200);
  const host = new URL(siteUrl()).host;
  const font = await loadOgFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        backgroundColor: "#f7f0f6",
        backgroundImage: "linear-gradient(135deg, #f7f0f6, #ffffff)",
        color: "#171717",
        fontFamily: "Chiron",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, color: "#ad5492" }}>
        {siteName}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 1050,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.18,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#525252",
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: "#8f6b84",
        }}
      >
        <div style={{ display: "flex" }}>{host}</div>
        <div style={{ display: "flex" }}>{siteName}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Chiron",
          data: font,
          weight: 400,
          style: "normal",
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
      },
    },
  );
}
