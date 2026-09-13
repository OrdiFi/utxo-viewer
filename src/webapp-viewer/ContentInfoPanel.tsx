"use client";

import { useEffect, useMemo, useState } from "react";
import { viewerApiFetch } from "./viewerApi";

function isLikelyInscriptionId(value: string) {
  return /^[0-9a-f]{64}i\d+$/i.test(value.trim());
}

type ContentInfo = {
  id: string;
  meta?: any;
  head?: any;
  spec?: any;
  summary?: any;
  sources?: any;
  cached_at?: string;
  error?: string;
  utxo?: string | null;
  owner?: string | null;
  height?: number | null;
  timestamp?: number | null;
  satpoint?: string | null;
};

type ContentInfoPanelProps = {
  id?: string | null;
  specId?: string | null;
  utxo?: string | null;
  contentIds?: string[];
};

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div className="ordifi-info-row">
      <div className="ordifi-info-label">
        {label}
      </div>

      <div
        className="ordifi-info-value"
        style={{
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, monospace"
            : "inherit",
        }}
      >
        {display}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ordifi-info-card">
      <div className="ordifi-info-title">
        {title}
      </div>

      {children}
    </section>
  );
}


export default function ContentInfoPanel({
  id: forcedId,
  specId: forcedSpecId,
  utxo: _utxo,
  contentIds: _contentIds = [],
}: ContentInfoPanelProps) {
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const id = (forcedId ?? searchParams.get("id") ?? "").trim();
  const specId = (forcedSpecId ?? id).trim();

  const [data, setData] = useState<ContentInfo | null>(null);
  const [rootSpecData, setRootSpecData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id || !isLikelyInscriptionId(id)) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await viewerApiFetch(`/api/content-info/${id}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || `Request failed: ${res.status}`);
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setData(null);
          setError(String(e?.message ?? e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (
        !specId ||
        !isLikelyInscriptionId(specId) ||
        specId === id
      ) {
        setRootSpecData(null);
        return;
      }

      try {
        const res = await viewerApiFetch(`/api/content-spec/${specId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json?.error || `Request failed: ${res.status}`
          );
        }

        if (!cancelled) {
          setRootSpecData(json);
        }
      } catch {
        if (!cancelled) {
          setRootSpecData(null);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [id, specId]);

const summary = data?.summary ?? {};
const specEnvelope =
  specId !== id && rootSpecData
    ? rootSpecData
    : data?.spec ?? null;
const spec = specEnvelope?.spec ?? null;
const specMeta = specEnvelope?.meta ?? null;
const head = data?.head ?? null;
const inscriptionNumber = data ? head?.number ?? "—" : "—";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        position: "sticky",
        top: 100,
      }}
    >
      <Section title="Content Info">
        {!id ? (
          <div
            style={{
              fontSize: 14,
              color: "rgba(17,24,39,0.65)",
            }}
          >
            Enter an inscription ID to load metadata.
          </div>
        ) : loading ? (
          <div
            style={{
              fontSize: 14,
              color: "rgba(17,24,39,0.65)",
            }}
          >
            Loading…
          </div>
        ) : error ? (
          <div
            style={{
              fontSize: 14,
              color: "#8b0000",
            }}
          >
            {error}
          </div>
        ) : (
          <>
            <Row label="Name" value={summary.name} />
            <Row label="Collection" value={summary.collection} />
            <Row label="Inscription" value={inscriptionNumber} />
            <Row label="ID" value={id} mono />
          </>
        )}
      </Section>

      <Section title="On-chain / Technical">
        <Row label="Type" value={summary.kind} />
        <Row label="Postage" value={summary.postage} />
        <Row label="Content type" value={summary.content_type} />
        <Row label="UTXO / Output" value={head?.utxo ?? "—"} />
        <Row label="Owner" value={head?.owner ?? "—"} />
        <Row label="Height" value={head?.height ?? "—"} />
        <Row label="Timestamp" value={head?.timestamp ?? "—"} />
        <Row label="Satpoint" value={head?.satpoint ?? "-"} mono />
      </Section>

      <Section title="Ordifi Spec">
        <Row label="Root ID" value={specId} mono />
        <Row
          label="Detected"
          value={specEnvelope?.detected ? "yes" : "no"}
        />
        <Row
          label="Type"
          value={specMeta?.type ?? spec?.type ?? null}
        />
        <Row
          label="Serial"
          value={specMeta?.serial ?? spec?.serial ?? null}
        />
        <Row
          label="Layout"
          value={
            spec?.layout
              ? `${spec.layout.width} × ${spec.layout.height}`
              : null
          }
        />
        <Row label="Slots" value={spec?.slotCount ?? null} />

      </Section>
    </div>
  );
}
