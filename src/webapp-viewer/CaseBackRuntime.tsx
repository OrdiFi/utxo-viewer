"use client";

import { useEffect, useMemo, useState } from "react";
import CaseSurfaceRuntime from "./CaseSurfaceRuntime";
import { viewerApiFetch } from "./viewerApi";

type Props = {
  backId: string;
  contentId?: string | null;
  size: number;
};

type CaseBackData = {
  onchain: {
    number: number | null;
    id: string;
    content_type: string | null;
    postage: number | null;
    height: number | null;
    timestamp: number | null;
    satpoint: string | null;
  };
  metadata: {
    collection: string | null;
    item: string | null;
    traits: string[];
  };
};

function highlightJsonLine(line: string) {
  const tokenPattern =
    /"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b/g;

  const parts: any[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    const token = match[0];

    if (index > lastIndex) {
      parts.push(line.slice(lastIndex, index));
    }

    const after = line.slice(index + token.length);

    let color = "#d8d8d8";

    if (token.startsWith('"')) {
      color = /^\s*:/.test(after)
        ? "#7ee787"
        : "#f0f0f0";
    } else if (/^-?\d/.test(token)) {
      color = "#79c0ff";
    } else {
      color = "#d2a8ff";
    }

    parts.push(
      <span key={`${index}-${token}`} style={{ color }}>
        {token}
      </span>,
    );

    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

export default function CaseBackRuntime({
  backId,
  contentId,
  size,
}: Props) {
  const [data, setData] = useState<CaseBackData | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!contentId) {
      setData(null);
      return;
    }

    async function load() {
      try {
        const [infoResponse, collectionResponse] =
          await Promise.all([
            viewerApiFetch(
              `/api/content-info/${encodeURIComponent(contentId!)}`,
              { cache: "no-store" },
            ),
            viewerApiFetch(
              `/api/collection-meta/${encodeURIComponent(contentId!)}`,
              { cache: "no-store" },
            ),
          ]);

        const info = infoResponse.ok
          ? await infoResponse.json()
          : null;

        const collection = collectionResponse.ok
          ? await collectionResponse.json()
          : null;

        if (cancelled) return;

        setData({
          onchain: {
            number:
              info?.head?.number ??
              info?.meta?.number ??
              null,
            id: contentId!,
            content_type:
              info?.head?.contentType ??
              info?.summary?.content_type ??
              null,
            postage:
              info?.summary?.postage ?? null,
            height:
              info?.head?.height ??
              info?.summary?.height ??
              null,
            timestamp:
              info?.head?.timestamp ??
              info?.summary?.timestamp ??
              null,
            satpoint:
              info?.head?.satpoint ?? null,
          },
          metadata: {
            collection:
              collection?.collection?.name ??
              info?.meta?.collection_name ??
              info?.meta?.collection ??
              null,
            item:
              collection?.item?.name ??
              info?.meta?.name ??
              null,
            traits: Array.isArray(collection?.traits)
              ? collection.traits.map(
                  (trait: any) =>
                    `${String(trait?.type ?? "")}: ${String(
                      trait?.value ?? "",
                    )}`,
                )
              : [],
          },
        });
      } catch {
        if (!cancelled) setData(null);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  const jsonLines = useMemo(
    () => (data ? JSON.stringify(data, null, 2).split("\n") : []),
    [data],
  );

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        background: "transparent",
      }}
    >
      <CaseSurfaceRuntime
        id={backId}
        size={size}
      />

      {contentId && data ? (
        <div
          style={{
            position: "absolute",
            left: `${(350 / 1726) * 100}%`,
            top: `${(529 / 1726) * 100}%`,
            width: `${(1024 / 1726) * 100}%`,
            height: `${(1024 / 1726) * 100}%`,
            boxSizing: "border-box",
            overflow: "hidden",
            background: "#000",
            color: "#d8d8d8",
            padding: `${Math.max(8, size * 0.015)}px`,
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: Math.max(6, size * 0.0085),
              lineHeight: 1.2,
            }}
          >
            {jsonLines.map((line, index) => (
              <span
                key={index}
                style={{
                  display: "block",
                }}
              >
                {highlightJsonLine(line)}
              </span>
            ))}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
