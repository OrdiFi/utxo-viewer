"use client";

import { useEffect, useState } from "react";
import { viewerApiFetch } from "./viewerApi";

type CaseSurfaceData = {
  layers: string[];
  footer: string | null;
  serial: string | null;
};

function absoluteAssetUrl(src: string) {
  if (!src) return "";

  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  return src.startsWith("/") ? src : `/${src}`;
}

export default function CaseSurfaceRuntime({
  id,
  size,
}: {
  id: string;
  size: number;
}) {
  const [data, setData] = useState<CaseSurfaceData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await viewerApiFetch(
          `/api/inscription/${encodeURIComponent(id)}?raw=1&base=1`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Case surface HTTP ${response.status}`);
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        const layers = Array.from(
          doc.querySelectorAll<HTMLImageElement>("img.layer"),
        )
          .map((img) => img.getAttribute("src") || "")
          .filter(Boolean)
          .map(absoluteAssetUrl);

        if (layers.length === 0) {
          throw new Error("No case layers found");
        }

        const footer =
          doc.querySelector(".case-footer")?.textContent?.trim() || null;

        const serial =
          doc.querySelector("#case-serial")?.textContent?.trim() || null;

        if (mounted) {
          setData({
            layers,
            footer,
            serial,
          });
        }
      } catch {
        if (mounted) {
          setData(null);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!data) {
    return null;
  }

  const scale = size / 1726;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: size,
        height: size,
        overflow: "hidden",
        background: "transparent",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1726,
          height: 1726,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: "transparent",
        }}
      >
        {data.layers.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: 1726,
              height: 1726,
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))}

        {data.footer ? (
          <div
            style={{
              position: "absolute",
              left: 323,
              top: 355,
              width: 520,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 18,
              fontWeight: 650,
              letterSpacing: "1.4px",
              color: "rgba(0, 0, 0, 0.62)",
              textAlign: "center",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 10,
            }}
          >
            {data.footer}
          </div>
        ) : null}

        {data.serial ? (
          <div
            style={{
              position: "absolute",
              left: 930,
              top: 335,
              width: 420,
              height: 48,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "2px",
              color: "rgba(0, 0, 0, 0.78)",
              textAlign: "right",
              textShadow:
                "0 1px 2px rgba(0,0,0,0.65), 0 0 8px rgba(255,255,255,0.18)",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 10,
            }}
          >
            {data.serial}
          </div>
        ) : null}
      </div>
    </div>
  );
}
