"use client";

import { useEffect, useState } from "react";
import { viewerApiFetch } from "./viewerApi";

type Area = { x: number; y: number; w: number; h: number };

type TraitScore = {
  score?: number | null;
  displayScore?: number | null;
  maxScore?: number | null;
  rank?: number | null;
  rankTotal?: number | null;
  evaluatedItems?: number | null;
  state?: string | null;
};

type Summary = {
  display?: {
    collection?: string | null;
    item?: string | null;
    number?: string | number | null;
    traitScore?: TraitScore | null;
  } | null;
  traitScore?: TraitScore | null;
  grading?: TraitScore | null;
};

type Props = {
  inscriptionId: string;
  area: Area;
  layoutW: number;
  layoutH: number;
  renderSize?: number;
  templateId?: string;
  isPreview?: boolean;
};

function shown(value: unknown): string {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

export default function SpecLabelMeta({
  inscriptionId,
  area,
  layoutW,
  layoutH,
  renderSize = 800,
  templateId,
}: Props) {
  const renderScale = Math.max(0.1, renderSize / 800);
  const scaled = (value: number) => value * renderScale;
  const [meta, setMeta] = useState<Summary | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await viewerApiFetch(
          `/api/content-summary/${encodeURIComponent(inscriptionId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`content-summary returned ${res.status}`);
        const data = (await res.json()) as Summary;
        if (mounted) setMeta(data ?? null);
      } catch {
        if (mounted) setMeta(null);
      }
    }

    if (inscriptionId) load();
    return () => {
      mounted = false;
    };
  }, [inscriptionId]);

  const grading = meta?.traitScore ?? meta?.grading ?? meta?.display?.traitScore ?? null;
  if (!meta || !area || !layoutW || !layoutH) return null;

  const score =
    grading?.displayScore ??
    (typeof grading?.score === "number" ? Math.round(grading.score) : null);
  const rankTotal = grading?.rankTotal ?? grading?.evaluatedItems ?? null;
  const horizontalInset = area.w * 0.16;
  const verticalInset = area.h * 0.06;
  const caseVerticalOffset =
    templateId === "ordifi-case-label-v1" ? 10 : 0;
  const leftExtension = 12;
  const labelArea = {
    x: area.x + horizontalInset - leftExtension,
    y: area.y + verticalInset - caseVerticalOffset,
    w: area.w - horizontalInset * 2 + leftExtension,
    h: area.h - verticalInset * 2,
  };

  return (
    <div
      data-template={templateId ?? ""}
      data-trait-state={grading?.state ?? "N/A"}
      style={{
        position: "absolute",
        left: `${(labelArea.x / layoutW) * 100}%`,
        top: `${(labelArea.y / layoutH) * 100}%`,
        width: `${(labelArea.w / layoutW) * 100}%`,
        height: `${(labelArea.h / layoutH) * 100}%`,
        zIndex: 30,
        pointerEvents: "none",
        color: "#111",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        alignItems: "start",
        columnGap: scaled(30),
        padding: scaled(5),
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: scaled(4),
        }}
      >
        <div style={{ fontSize: scaled(18), fontWeight: 900, lineHeight: 1.05 }}>
          {meta.display?.collection ?? "N/A"}
        </div>
        <div style={{ fontSize: scaled(18), fontWeight: 900, lineHeight: 1.05 }}>
          {meta.display?.item ?? "N/A"}
        </div>
        <div
          style={{
            fontSize: scaled(18),
            fontWeight: 800,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {meta.display?.number ?? "N/A"}
        </div>
        <div
          style={{
            marginTop: scaled(4),
            fontSize: scaled(8),
            fontWeight: 650,
            lineHeight: 1,
            opacity: 0.68,
            whiteSpace: "nowrap",
            letterSpacing: scaled(-0.2),
          }}
        >
          ID: {inscriptionId}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: scaled(5),
          fontSize: scaled(16),
          fontWeight: 800,
          lineHeight: 1.1,
          textAlign: "left",
          whiteSpace: "nowrap",
        }}
      >
        <span>TraitScore</span>
        <span>Rank</span>
        <span>State</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: scaled(5),
          fontSize: scaled(16),
          fontWeight: 800,
          lineHeight: 1.1,
          textAlign: "left",
          whiteSpace: "nowrap",
        }}
      >
        <span>{shown(score)}</span>
        <span>{shown(grading?.rank)} / {shown(rankTotal)}</span>
        <span>{shown(grading?.state)}</span>
      </div>
    </div>
  );
}