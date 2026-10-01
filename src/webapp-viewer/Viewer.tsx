"use client";

import { useEffect, useMemo, useState } from "react";
import SpecLabelMeta from "./SpecLabelMeta";
import { OrdiFiRuntime } from "./OrdiFiRuntime";
import SurfacePairRuntime from "./SurfacePairRuntime";
import CaseSurfaceRuntime from "./CaseSurfaceRuntime";
import CaseBackRuntime from "./CaseBackRuntime";
import RuntimeBadge from "./RuntimeBadge";
import { detectOrdifiMeta } from "./ordinalMeta";
import { viewerApiFetch, viewerUrl } from "./viewerApi";
import {
  normalizeGroupDirective,
  normalizeCompositionRelation,
  resolveLogicalCompositions,
  type PhysicalMember,
  type LogicalComposition,
} from "./groupResolver";


type Placement = {
  id: string;
  slot?: number | null;
  slotIndex?: number | null;
  slotNumber?: number | null;
  index?: number;
  offset?: number | null;
};

type SurfacePair = {
  frontId: string;
  backId: string;
  offset: number;
};

const DEFAULT_GRID4_SPEC = {
  layout: { width: 2048, height: 2048 },
  slotCount: 4,
  slots: [
    { slot: 1, x: 80, y: 80, w: 900, h: 900 },
    { slot: 2, x: 1068, y: 80, w: 900, h: 900 },
    { slot: 3, x: 80, y: 1068, w: 900, h: 900 },
    { slot: 4, x: 1068, y: 1068, w: 900, h: 900 },
  ],
};

const DEFAULT_GRID9_SPEC = {
  layout: { width: 3072, height: 3072 },
  slotCount: 9,
  slots: [
    { slot: 1, x: 93, y: 93, w: 900, h: 900 },
    { slot: 2, x: 1086, y: 93, w: 900, h: 900 },
    { slot: 3, x: 2079, y: 93, w: 900, h: 900 },
    { slot: 4, x: 93, y: 1086, w: 900, h: 900 },
    { slot: 5, x: 1086, y: 1086, w: 900, h: 900 },
    { slot: 6, x: 2079, y: 1086, w: 900, h: 900 },
    { slot: 7, x: 93, y: 2079, w: 900, h: 900 },
    { slot: 8, x: 1086, y: 2079, w: 900, h: 900 },
    { slot: 9, x: 2079, y: 2079, w: 900, h: 900 },
  ],
};

const DEFAULT_GRID16_SPEC = {
  layout: { width: 4096, height: 4096 },
  slotCount: 16,
  slots: [
    { slot: 1, x: 104, y: 104, w: 900, h: 900 },
    { slot: 2, x: 1100, y: 104, w: 900, h: 900 },
    { slot: 3, x: 2096, y: 104, w: 900, h: 900 },
    { slot: 4, x: 3092, y: 104, w: 900, h: 900 },
    { slot: 5, x: 104, y: 1100, w: 900, h: 900 },
    { slot: 6, x: 1100, y: 1100, w: 900, h: 900 },
    { slot: 7, x: 2096, y: 1100, w: 900, h: 900 },
    { slot: 8, x: 3092, y: 1100, w: 900, h: 900 },
    { slot: 9, x: 104, y: 2096, w: 900, h: 900 },
    { slot: 10, x: 1100, y: 2096, w: 900, h: 900 },
    { slot: 11, x: 2096, y: 2096, w: 900, h: 900 },
    { slot: 12, x: 3096, y: 2096, w: 900, h: 900 },
    { slot: 13, x: 104, y: 3092, w: 900, h: 900 },
    { slot: 14, x: 1100, y: 3092, w: 900, h: 900 },
    { slot: 15, x: 2096, y: 3092, w: 900, h: 900 },
    { slot: 16, x: 3092, y: 3092, w: 900, h: 900 },
  ],
};

function getDefaultGrid(count: number) {
  if (count <= 4) {
    return {
      image: viewerUrl("/products/container-layouts/display_grid_4_default.png"),
      spec: DEFAULT_GRID4_SPEC,
    };
  }

  if (count <= 9) {
    return {
      image: viewerUrl("/products/container-layouts/display_grid_9_default.webp"),
      spec: DEFAULT_GRID9_SPEC,
    };
  }

  return {
    image: viewerUrl("/products/container-layouts/display_grid_16_default.webp"),
    spec: DEFAULT_GRID16_SPEC,
  };
}

function normalizeInput(value: string) {
  return value.trim();
}

function n(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function slotNumber(slot: any, index: number) {
  return n(slot.slot) ?? n(slot.index) ?? n(slot.id) ?? index + 1;
}

function normalizeItems(info: any): Placement[] {
  const raw =
    info.items ??
    info.placements ??
    info.itemPlacements ??
    info.itemIds ??
    [];

  if (!Array.isArray(raw)) return [];

  const items = raw
    .map((item: any, index: number) => {
      if (typeof item === "string") {
        return {
          id: item,
          index,
          slot: null,
          slotIndex: null,
          slotNumber: null,
          offset: null,
        };
      }

      const id =
        item.id ??
        item.inscriptionId ??
        item.inscription_id ??
        item.itemId ??
        item.item_id;

      if (!id) return null;

      return {
        id: String(id),
        index,
        slot: n(item.slot),
        slotIndex: n(item.slotIndex),
        slotNumber: n(item.slotNumber),
        offset: n(item.offset),
      };
    })
    .filter(Boolean) as Placement[];

  const hasOffsets =
    items.length > 0 && items.every((item) => item.offset !== null);

  if (hasOffsets) {
    return [...items].sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0));
  }

  return items;
}

function PreviewFrame({
  id,
  size,
}: {
  id: string;
  size: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        borderRadius: 0,
        overflow: "hidden",
        background: "transparent",
        boxShadow: "none",
        border: "none",
      }}
    >
      <iframe
        src={viewerUrl(`/api/inscription/${id}?viewer=1&embed=1`)}
        title={id}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "transparent",
        }}
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}

function CompositionFrame({
  info,
  size,
  isPreview,
}: {
  info: any;
  size: number;
  isPreview?: boolean;
}) {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    viewerApiFetch(`/api/content-spec/${info.rootId}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setSpec(data);
      })
      .catch(() => {
        if (mounted) setSpec(null);
      });

    return () => {
      mounted = false;
    };
  }, [info.rootId]);

  const resolvedSpec =
  info.spec ??
  spec;

  const slots =
    resolvedSpec?.slots ??
    resolvedSpec?.spec?.slots ??
    resolvedSpec?.layout?.slots ??
    [];
  if (!Array.isArray(slots) || slots.length === 0) {
    return <PreviewFrame id={info.rootId} size={size} />;
  }

  const layoutW =
    Number(resolvedSpec?.layout?.width) ||
    Number(resolvedSpec?.width) ||
    size;

  const layoutH =
    Number(resolvedSpec?.layout?.height) ||
    Number(resolvedSpec?.height) ||
    size;

  const placements = normalizeItems(info);

  const itemIds: string[] = placements.map((item) => item.id);

  const hasExplicitStructuralSlots = placements.some(
    (item) =>
      item.slotNumber !== null && item.slotNumber !== undefined ||
      item.slot !== null && item.slot !== undefined ||
      item.slotIndex !== null && item.slotIndex !== undefined,
  );

  const labelArea = resolvedSpec?.label?.area ?? null;
  const labelTemplateId = resolvedSpec?.label?.template?.id;
  const labelContentId = itemIds[0] ?? null;

  const caseLayoutName = String(
    resolvedSpec?.layoutName ??
    resolvedSpec?.spec?.layoutName ??
    resolvedSpec?.layout?.name ??
    ""
  ).toLowerCase();

  const isCaseLayout = caseLayoutName === "case";

  return (
    <div
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        borderRadius: 0,
        overflow: "hidden",
       background: "transparent",
        boxShadow: "none",
        border: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {/* ROOT / LAYOUT BACKGROUND */}
        {isCaseLayout ? (
          <CaseSurfaceRuntime
            id={info.rootId}
            size={size}
          />
        ) : (
          <iframe
            src={viewerUrl(`/api/inscription/${info.rootId}?viewer=1&embed=1`)}
            title={info.rootId}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
              background: "transparent",
              zIndex: 1,
              pointerEvents: "none",
            }}
            scrolling="no"
            sandbox="allow-scripts"
          />
        )}
        {labelArea && labelContentId ? (
            <SpecLabelMeta
              inscriptionId={labelContentId}
              area={labelArea}
              layoutW={layoutW}
              layoutH={layoutH}
              renderSize={size}
              templateId={labelTemplateId}
              isPreview={isPreview}
            />
          ) : null}

        {/* SLOT CONTENTS - same coordinate logic as Composer CoordinatePreview */}
        {slots.map((slot: any, idx: number) => {
          const wantedSlotNumber = slotNumber(slot, idx);

          const explicitPlacement = placements.find((item) => {
            const explicit =
              item.slotNumber ?? item.slot ?? null;

            if (explicit !== null) {
              return explicit === wantedSlotNumber;
            }

            if (item.slotIndex !== null && item.slotIndex !== undefined) {
              return item.slotIndex === idx || item.slotIndex === idx + 1;
            }

            return false;
          });

          /*
           * Once structural numbers exist, an unassigned inscription MUST NOT
           * backfill a missing slot. Missing number = intentionally empty.
           * Legacy compact fallback is used only when no item carries
           * structural slot information at all.
           */
          const placement =
            explicitPlacement ??
            (!hasExplicitStructuralSlots ? placements[idx] : null);

          const itemId = placement?.id;
          if (!itemId) return null;

          const slotW = Number(slot.w ?? slot.width);
          const slotH = Number(slot.h ?? slot.height);
          const slotX = Number(slot.x);
          const slotY = Number(slot.y);

          const renderedX = Math.round((slotX / layoutW) * size);
          const renderedY = Math.round((slotY / layoutH) * size);
          const renderedW = Math.round((slotW / layoutW) * size);
          const renderedH = Math.round((slotH / layoutH) * size);

          if (
            !Number.isFinite(slotX) ||
            !Number.isFinite(slotY) ||
            !Number.isFinite(slotW) ||
            !Number.isFinite(slotH)
          ) {
            return null;
          }

          return (
            <div
              key={`${itemId}-${idx}`}
              style={{
                position: "absolute",
               left: `${renderedX}px`,
               top: `${renderedY}px`,
               width: `${renderedW}px`,
               height: `${renderedH}px`,
                overflow: "hidden",
                zIndex: 10,
                background:"transparent",
              }}
            >
              <iframe
                src={viewerUrl(`/api/inscription/${itemId}?viewer=1&embed=1`)}
                title={itemId}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  background: "transparent",
                }}
                scrolling="no"
                sandbox="allow-scripts"
              />
</div>
          );
        })}
      </div>
    </div>
  );
}

function FallbackCompositionFrame({
  ids,
  size,
}: {
  ids: string[];
  size: number;
}) {
  const fallback = getDefaultGrid(ids.length);
    if (ids.length === 1) {
    return <PreviewFrame id={ids[0]} size={size} />;
  }
  const spec = fallback.spec;
  const slots = spec.slots;
  const layoutW = spec.layout.width;
  const layoutH = spec.layout.height;

  return (
    <div
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        borderRadius: 0,
        overflow: "hidden",
        background: "transparent",
        boxShadow: "none",
        border: "none",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <img
          src={fallback.image}
          alt="Default layout"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {slots.map((slot: any, idx: number) => {
          const itemId = ids[idx];
          if (!itemId) return null;

          return (
            <div
              key={`${itemId}-${idx}`}
              style={{
                position: "absolute",
                left: `${(slot.x / layoutW) * 100}%`,
                top: `${(slot.y / layoutH) * 100}%`,
                width: `${(slot.w / layoutW) * 100}%`,
                height: `${(slot.h / layoutH) * 100}%`,
                overflow: "hidden",
                zIndex: 10,
                background: "transparent",
              }}
            >
              <iframe
                src={viewerUrl(`/api/inscription/${itemId}?viewer=1&embed=1`)}
                title={itemId}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  background: "transparent",
                }}
                scrolling="no"
                sandbox="allow-scripts"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ViewerFrame({
  id,
  size,
  isPreview = false,
}: {
  id: string;
  size: number;
  isPreview?: boolean;
}) {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    viewerApiFetch(`/api/content-composition/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setInfo(data);
      })
      .catch(() => {
        if (mounted) setInfo({ isComposition: false });
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!info) {
    return (
      <div
        style={{
          width: size,
          height: size,
          margin: "0 auto",
          borderRadius: 0,
          display: "grid",
          placeItems: "center",
          background: "transparent",
          color: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!info.isComposition) {
    return <PreviewFrame id={id} size={size} />;
  }

  return <CompositionFrame info={info} size={size} isPreview={isPreview}/>;
}

function runtimeComponent(spec: any) {
  return String(
    spec?.runtime?.component ??
      spec?.render?.component ??
      spec?.kind ??
      "",
  ).toLowerCase();
}

function isRuntimeObject(spec: any) {
  const component = runtimeComponent(spec);

  return (
    component.includes("suitcase") ||
    component.includes("album")
  );
}

function caseContentIdFromComposition(
  composition: LogicalComposition | null | undefined,
  frontId: string,
  backId: string,
  fallbackItems: Placement[],
) {
  const children = Array.isArray((composition as any)?.children)
    ? (composition as any).children
    : [];

  for (const child of children) {
    const candidates: string[] = [];

    if (typeof child?.specId === "string") {
      candidates.push(child.specId);
    }

    if (Array.isArray(child?.ids)) {
      for (const id of child.ids) {
        if (typeof id === "string") candidates.push(id);
      }
    }

    if (Array.isArray(child?.members)) {
      for (const member of child.members) {
        const id = member?.placement?.id;
        if (typeof id === "string") candidates.push(id);
      }
    }

    const contentId = candidates.find(
      (id) => id !== frontId && id !== backId,
    );

    if (contentId) return contentId;
  }

  return (
    fallbackItems.find(
      (item) =>
        item.id !== frontId &&
        item.id !== backId,
    )?.id ?? null
  );
}

function UtxoViewer({
  utxo,
  size,
  isPreview = false,
  viewerOnly = false,
  runtimeEnabled = false,
  focusId: _focusId,
  onInfoChange,
}: {
  utxo: string;
  size: number;
  isPreview?: boolean;
  viewerOnly?: boolean;
  runtimeEnabled?: boolean;
  focusId?: string;
  onInfoChange?: (info: {
    id: string | null;
    specId: string | null;
    utxo: string | null;
    contentIds: string[];
    contents: { id: string; offset: number | null }[];
  }) => void;
}) {
  const [items, setItems] = useState<Placement[]>([]);
  const [specRootId, setSpecRootId] = useState<string | null>(null);
  const [specData, setSpecData] = useState<any>(null);
  const [resolvedLogicalCompositions, setResolvedLogicalCompositions] =
    useState<LogicalComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [surfacePairs, setSurfacePairs] = useState<SurfacePair[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      setActiveIndex(null);
      setSpecRootId(null);
      setSpecData(null);
      setSurfacePairs([]);
      setResolvedLogicalCompositions([]);

      try {
        const res = await viewerApiFetch(`/api/ord/output/${encodeURIComponent(utxo)}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Could not load UTXO output.");

        await res.json();
            let foundSpecRootId: string | null = null;

        const offsetsRes = await viewerApiFetch(
            `/api/content-offsets/${encodeURIComponent(utxo)}`,
            { cache: "no-store" }
          );

          const offsetsJson = offsetsRes.ok ? await offsetsRes.json() : null;

        const offsetEntries = Array.isArray(offsetsJson?.entries)
  ? offsetsJson.entries
  : [];

/*
 * Neutral physical rule:
 * one satpoint becomes one visible structural member.
 *
 * Exception:
 * an explicit OrdiFi front/back pair on the same satpoint
 * is treated as one two-sided presentation object.
 *
 * The front remains the structural member. The back is
 * presentation-only and does not alter structural semantics.
 */

const rawPlacements: Placement[] = offsetEntries
  .map((entry: any, index: number) => ({
    id: String(entry.id),
    index,
    offset: entry.offset ?? null,
  }))
  .filter(
    (item: Placement) =>
      item.id && item.offset !== null,
  )
  .sort(
    (a: Placement, b: Placement) =>
      Number(a.offset) - Number(b.offset) ||
      Number(a.index ?? 0) - Number(b.index ?? 0),
  );

const byOffset = new Map<number, Placement[]>();

for (const item of rawPlacements) {
  const offset = Number(item.offset);
  const group = byOffset.get(offset) ?? [];

  group.push(item);
  byOffset.set(offset, group);
}

const normalizedWithOffsets: Placement[] = [];
const foundSurfacePairs: SurfacePair[] = [];

for (const [offset, group] of byOffset) {
  if (group.length === 1) {
    normalizedWithOffsets.push(group[0]);
    continue;
  }

  const classified = await Promise.all(
    group.map(async (item) => {
      const meta = await detectOrdifiMeta(item.id);

      return {
        item,
        side: meta.side,
      };
    }),
  );

  const frontCandidates = classified.filter(
    (entry) => entry.side === "front",
  );

  const backCandidates = classified.filter(
    (entry) => entry.side === "back",
  );

  const back =
    backCandidates.length === 1
      ? backCandidates[0].item
      : null;

  /*
   * Compatibility:
   * Older/front inscriptions may not yet carry
   * ordifi:side=front. If exactly one back exists and
   * exactly two inscriptions share the satpoint,
   * the other inscription is the front.
   */
  const front =
    frontCandidates.length === 1
      ? frontCandidates[0].item
      : back && group.length === 2
        ? group.find(
            (item) => item.id !== back.id,
          ) ?? null
        : null;

  if (front && back) {
    foundSurfacePairs.push({
      frontId: front.id,
      backId: back.id,
      offset,
    });

    normalizedWithOffsets.push(front);
    continue;
  }

  /*
   * Ambiguous multi-inscription satpoint:
   * preserve the neutral viewer behaviour.
   */
  normalizedWithOffsets.push(group[0]);
}

const physicalMembers: PhysicalMember[] = [];
let foundSpecData: any = null;

for (const item of normalizedWithOffsets) {
  try {
    const specRes = await viewerApiFetch(
      `/api/content-spec/${item.id}`,
      { cache: "no-store" },
    );

    if (!specRes.ok) {
      physicalMembers.push({
        placement: item,
        specId: null,
        spec: null,
        group: null,
        relation: null,
      });

      continue;
    }

    const specJson = await specRes.json();
    const resolvedSpec = specJson?.spec ?? specJson;

    const ownSpec =
      specJson?.source?.specId === item.id;

    physicalMembers.push({
      placement: item,
      specId: ownSpec ? item.id : null,
      spec: ownSpec ? resolvedSpec : null,
      group: ownSpec
        ? normalizeGroupDirective(resolvedSpec)
        : null,
      relation: ownSpec
        ? normalizeCompositionRelation(resolvedSpec)
        : null,
    });

    if (!ownSpec) continue;

    const slots =
      resolvedSpec?.slots ??
      resolvedSpec?.spec?.slots ??
      resolvedSpec?.layout?.slots ??
      [];

    /*
     * Desktop Runtime 1.0:
     * only Suitcase and Album are runtime roots.
     * Machines are deliberately not recognised here.
     */
    if (
      !foundSpecRootId &&
      isRuntimeObject(resolvedSpec)
    ) {
      foundSpecRootId = item.id;
      foundSpecData = resolvedSpec;
      continue;
    }

    if (
      !foundSpecRootId &&
      Array.isArray(slots) &&
      slots.length > 0
    ) {
      foundSpecRootId = item.id;
      foundSpecData = resolvedSpec;
    }
  } catch {
    physicalMembers.push({
      placement: item,
      specId: null,
      spec: null,
      group: null,
      relation: null,
    });
  }
}

const nextLogicalCompositions =
  resolveLogicalCompositions(physicalMembers);

if (!mounted) return;

if (normalizedWithOffsets.length === 0) {
  setItems([]);

  setError("No inscriptions found in this UTXO.");
  return;
}

setItems(normalizedWithOffsets);
setSurfacePairs(foundSurfacePairs);

setSpecRootId(foundSpecRootId);
setSpecData(foundSpecData);
setResolvedLogicalCompositions(
  nextLogicalCompositions,
);

      } catch (e: any) {
        if (mounted) setError(e?.message || "Could not load UTXO.");
      } finally {
        if (mounted) setLoading(false);
      }
    }


    load();


    return () => {
      mounted = false;
    };
  }, [utxo]);

  const ids = items.map((item) => item.id);
  const activeItem =
    activeIndex !== null
      ? items[activeIndex]
      : null;

  const rootLogicalComposition =
    resolvedLogicalCompositions.find(
      (composition) =>
        composition.specId === specRootId,
    ) ?? null;

  const renderRuntimeChild = (
    logicalComposition: LogicalComposition,
    childSize: number,
  ) => (
    <ViewerFrame
      id={logicalComposition.specId}
      size={childSize}
      isPreview={true}
    />
  );

const contentIdsKey = ids.join("|");

useEffect(() => {
  if (!onInfoChange) return;

 onInfoChange({
  id:
    activeItem?.id ??
    items.find((item) => item.offset === 0)?.id ??
    ids[0] ??
    specRootId ??
    null,
  specId: specRootId,
  utxo,
  contentIds: ids,
  contents: items.map((item) => ({
    id: item.id,
    offset: item.offset ?? null,
  })),
});
}, [
  activeItem?.id,
  specRootId,
  contentIdsKey,
  utxo,
  onInfoChange,
]);

  if (loading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          margin: "0 auto",
          display: "grid",
          placeItems: "center",
          background: "rgba(18,24,38,0.92)",
          color: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        Loading UTXO…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          background: "rgba(255, 240, 240, 0.95)",
          border: "1px solid rgba(180,0,0,0.12)",
          color: "#8b0000",
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }



  const rootSurfacePair = specRootId
    ? surfacePairs.find(
        (pair) => pair.frontId === specRootId,
      ) ?? null
    : null;

  const activeSurfacePair = activeItem
    ? surfacePairs.find(
        (pair) => pair.frontId === activeItem.id,
      ) ?? null
    : null;

  const rootIsCase =
    String(
      specData?.layoutName ??
      specData?.spec?.layoutName ??
      specData?.layout?.name ??
      ""
    ).toLowerCase() === "case";

  const rootCaseContentId =
    rootSurfacePair && rootIsCase
      ? caseContentIdFromComposition(
          rootLogicalComposition,
          rootSurfacePair.frontId,
          rootSurfacePair.backId,
          items,
        )
      : null;

  const rootRuntimeComponent = runtimeComponent(specData);

  const showingRuntimeRoot =
    !activeItem || activeItem.id === specRootId;

  const runtimeBadgeLabel =
    showingRuntimeRoot
      ? rootIsCase && rootSurfacePair
        ? "Case"
        : runtimeEnabled && rootRuntimeComponent.includes("suitcase")
          ? "Suitcase"
          : runtimeEnabled && rootRuntimeComponent.includes("album")
            ? "Album"
            : null
      : null;

  const rootView = specRootId
    ? runtimeEnabled && isRuntimeObject(specData)
      ? (
          <OrdiFiRuntime
            rootId={specRootId}
            spec={specData}
            logicalComposition={
              rootLogicalComposition ?? undefined
            }
            size={size}
            renderChild={renderRuntimeChild}
          />
        )
      : (
          <ViewerFrame
            id={specRootId}
            size={size}
            isPreview={isPreview}
          />
        )
    : null;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >

      {!isPreview && !viewerOnly ? (<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            style={{ fontWeight: activeIndex === null ? 700 : 400 }}
          >
            Grid
          </button>

          <button
            type="button"
            onClick={() => setActiveIndex(0)}
            disabled={items.length === 0}
            style={{ fontWeight: activeIndex !== null ? 700 : 400 }}
          >
            Single
          </button>

          <button
            type="button"
            disabled={activeIndex === null || activeIndex <= 0}
            onClick={() => setActiveIndex((i) => Math.max(0, (i ?? 0) - 1))}
          >
            Prev
          </button>

          <button
            type="button"
            disabled={activeIndex === null || activeIndex >= items.length - 1}
            onClick={() => setActiveIndex((i) => Math.min(items.length - 1, (i ?? 0) + 1))}
          >
            Next
          </button>

          <span style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
            {activeItem
              ? `offset ${activeItem.offset}`
              : `${items.length} item${items.length === 1 ? "" : "s"} in UTXO`}
          </span>
        </div>) : null}


              {activeItem ? (
                activeItem.id ? (
                  activeSurfacePair ? (
                    <SurfacePairRuntime
                      front={
                        activeItem.id === specRootId &&
                        rootView
                          ? rootView
                          : (
                              <ViewerFrame
                                id={activeItem.id}
                                size={size}
                                isPreview={isPreview}
                              />
                            )
                      }
                      back={
                        activeItem.id === specRootId && rootIsCase ? (
                          <CaseBackRuntime
                            backId={activeSurfacePair.backId}
                            contentId={rootCaseContentId}
                            size={size}
                          />
                        ) : (
                          <PreviewFrame
                            id={activeSurfacePair.backId}
                            size={size}
                          />
                        )
                      }
                      size={size}
                    />
                  ) : (
                    <PreviewFrame
                      id={activeItem.id}
                      size={size}
                    />
                  )
                ) : (
                  <div>
                    Missing inscription id for selected offset.
                  </div>
                )
              ) : specRootId ? (
                rootSurfacePair ? (
                  <SurfacePairRuntime
                    front={rootView}
                    back={
                      rootIsCase ? (
                        <CaseBackRuntime
                          backId={rootSurfacePair.backId}
                          contentId={rootCaseContentId}
                          size={size}
                        />
                      ) : (
                        <PreviewFrame
                          id={rootSurfacePair.backId}
                          size={size}
                        />
                      )
                    }
                    size={size}
                  />
                ) : (
                  rootView
                )
              ) : (
                <FallbackCompositionFrame
                  ids={ids}
                  size={size}
                />
              )}

              {runtimeBadgeLabel ? (
                <RuntimeBadge label={runtimeBadgeLabel} />
              ) : null}
            </div>
          );
        }

export default function Viewer({
  size = 800,
  initialId: forcedInitialId,
  embedded = false,
  isPreview = false,
  viewerOnly = false,
  runtimeEnabled = false,
  focusId,
  onInfoChange,
}: {
  size?: number;
  initialId?: string;
  embedded?: boolean;
  isPreview?: boolean;
  viewerOnly?: boolean;
  runtimeEnabled?: boolean;
  focusId?: string;
  onInfoChange?: (info: {
    id: string | null;
    specId: string | null;
    utxo: string | null;
    contentIds: string[];
    contents: { id: string; offset: number | null }[];
  }) => void;
}) {
  const pathname = window.location.pathname;

  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const router = useMemo(
    () => ({
      replace(url: string) {
        window.history.replaceState(
          null,
          "",
          url,
        );
      },
    }),
    [],
  );
  const logicalSpecId = searchParams.get("logicalSpecId");

const logicalItemIds = (
  searchParams.get("logicalItemIds") ?? ""
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const logicalPlacements: Placement[] = (() => {
  const raw = searchParams.get("logicalPlacements");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const placements: Placement[] = [];

    parsed.forEach((item: any, index: number) => {
      const id =
        item?.id ??
        item?.inscriptionId ??
        item?.inscription_id ??
        item?.itemId ??
        item?.item_id;

      if (!id) return;

      placements.push({
        id: String(id),
        index,
        slot: n(item?.slot),
        slotIndex: n(item?.slotIndex),
        slotNumber: n(item?.slotNumber ?? item?.number),
        offset: n(item?.offset),
      });
    });

    return placements;
  } catch {
    return [];
  }
})();
  const initialQuery =
    forcedInitialId ??
    searchParams.get("utxo") ??
    searchParams.get("id") ??
    "";

  const [input, setInput] = useState(initialQuery);
  const [resolved, setResolved] = useState<any>(null);
  const [loadingResolve, setLoadingResolve] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  function isViewerIframeSource(
    source: MessageEventSource | null,
  ): source is Window {
    if (!source) return false;

    const frames = Array.from(
      document.querySelectorAll("iframe"),
    );

    return frames.some(
      (frame) => frame.contentWindow === source,
    );
  }

  function sendMessage(
    target: Window,
    message: any,
  ) {
    /*
      Sandboxed inscription iframes use an opaque origin.
      Therefore the response targetOrigin must be "*".

      Security comes from sending only back to the exact
      event.source that was verified as a Viewer iframe.
    */
    target.postMessage(message, "*");
  }

  async function onMessage(event: MessageEvent) {
    if (!isViewerIframeSource(event.source)) {
      return;
    }

    const message = event.data;

    if (
      !message ||
      typeof message !== "object" ||
      typeof message.type !== "string"
    ) {
      return;
    }

    const requestId =
      typeof message.requestId === "string"
        ? message.requestId
        : null;

    if (!requestId) {
      return;
    }

    const provider =
      (window as any)?.BitcoinProvider ||
      (window as any)?.XverseProviders?.BitcoinProvider ||
      null;

    /*
      ===== Wallet Connect =====
    */
    if (message.type === "ordifi:wallet-connect") {
      if (!provider?.request) {
        sendMessage(event.source, {
          type: "ordifi:wallet-connect-result",
          requestId,
          ok: false,
          error: "No wallet provider found in Viewer host.",
        });

        return;
      }

      try {
        const result = await provider.request(
          "getAccounts",
          {
            purposes: ["payment", "ordinals"],
            message: "Connect to OrdiFi Machine",
          },
        );

        sendMessage(event.source, {
          type: "ordifi:wallet-connect-result",
          requestId,
          ok: true,
          result,
        });
      } catch (error: any) {
        sendMessage(event.source, {
          type: "ordifi:wallet-connect-result",
          requestId,
          ok: false,
          error:
            error?.message ||
            "Wallet connection failed.",
        });
      }

      return;
    }

    /*
      ===== PSBT Sign =====
    */
    if (message.type === "ordifi:wallet-sign-psbt") {
      if (!provider?.request) {
        sendMessage(event.source, {
          type: "ordifi:wallet-sign-psbt-result",
          requestId,
          ok: false,
          error: "No wallet provider found in Viewer host.",
        });

        return;
      }

      const psbt =
        typeof message?.psbt === "string"
          ? message.psbt.trim()
          : "";

      if (!psbt) {
        sendMessage(event.source, {
          type: "ordifi:wallet-sign-psbt-result",
          requestId,
          ok: false,
          error: "Missing PSBT.",
        });

        return;
      }

      try {
        const result = await provider.request(
          "signPsbt",
          {
            psbt,
            signInputs:
              message?.signInputs ?? undefined,
            broadcast: false,
          },
        );

        sendMessage(event.source, {
          type: "ordifi:wallet-sign-psbt-result",
          requestId,
          ok: true,
          result,
        });
      } catch (error: any) {
        sendMessage(event.source, {
          type: "ordifi:wallet-sign-psbt-result",
          requestId,
          ok: false,
          error:
            error?.message ||
            "PSBT signing failed.",
        });
      }
    }
  }

  window.addEventListener("message", onMessage);

  return () => {
    window.removeEventListener("message", onMessage);
  };
}, []);

  async function loadInput(raw: string, updateUrl = false) {
    const next = normalizeInput(raw);

    if (!next) {
      setResolved(null);
      setError("Enter an inscription ID, inscription number, or UTXO.");
      return;
    }

    setLoadingResolve(true);
    setError(null);
    setResolved(null);

    try {
      const res = await viewerApiFetch(
        `/api/viewer/resolve?input=${encodeURIComponent(next)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No inscription found for this input.");
      }

      setResolved(data);

      if (updateUrl) {
        const params = new URLSearchParams(searchParams.toString());

        params.delete("id");
        params.delete("utxo");

        if (data.kind === "utxo" && data.utxo) {
          params.set("utxo", data.utxo);
        } else if (data.id) {
          params.set("id", data.id);
        }

        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch (e: any) {
      setResolved(null);
      setError(e?.message || "Viewer search failed.");
    } finally {
      setLoadingResolve(false);
    }
  }

  useEffect(() => {


  const urlInput =
    forcedInitialId ??
    searchParams.get("utxo") ??
    searchParams.get("id") ??
    "";
    setInput(urlInput);
    setError(null);

    if (urlInput) {
      loadInput(urlInput, false);
    } else {
      setResolved(null);
    }
  }, [searchParams, forcedInitialId]);

   useEffect(() => {
    if (!onInfoChange || !resolved?.ok) return;

    const contentIds = Array.isArray(resolved.contentIds)
      ? resolved.contentIds
      : resolved.id
        ? [resolved.id]
        : [];

    const contents = Array.isArray(resolved.contents)
      ? resolved.contents.map((item: any) => ({
          id: item.id,
          offset: item.offset ?? null,
        }))
      : resolved.id
        ? [{ id: resolved.id, offset: 0 }]
        : [];

    const primaryId =
      resolved.kind === "utxo"
        ? contents.find((item: any) => item.offset === 0)?.id ??
          contentIds[0] ??
          resolved.id ??
          resolved.rootId ??
          null
        : resolved.id ?? resolved.rootId ?? contentIds[0] ?? null;

    onInfoChange({
      id: primaryId,
      specId: resolved.rootId ?? null,
      utxo: resolved.utxo ?? null,
      contentIds,
      contents,
    });
  }, [resolved, onInfoChange]);

  function submit(nextRaw?: string) {
    loadInput(nextRaw ?? input, true);
  }
  if (logicalSpecId) {
  return (
    <CompositionFrame
      info={{
        rootId: logicalSpecId,
        items:
          logicalPlacements.length > 0
            ? logicalPlacements
            : logicalItemIds.map((id, index) => ({ id, index })),
      }}
      size={size}
      isPreview={true}
    />
  );
}


  return (
    <div
      style={{
        width: "100%",
        maxWidth: 980,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
     {!embedded && !viewerOnly ? (
      <div className="ordifi-viewer-searchbar">
       <input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") submit();
  }}
  placeholder="Enter inscription ID, number, or UTXO…"
  spellCheck={false}
  autoCapitalize="none"
  autoCorrect="off"
  className="ordifi-viewer-input"
/>

       <button
  onClick={() => submit()}
  className="ordifi-viewer-load"
>
  Load
</button>
      </div>
      ) : null}

      {error ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(255, 240, 240, 0.95)",
            border: "1px solid rgba(180,0,0,0.12)",
            color: "#8b0000",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

           {loadingResolve ? (
        <div
          style={{
            width: size,
            height: size,
            margin: "0 auto",
            borderRadius: 0,
            display: "grid",
            placeItems: "center",
            background: "transparent",
            color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(0,245,230,0.22)",
          }}
        >
          Resolving input…
        </div>
      ) : null}

      {!loadingResolve && !resolved ? (
        <div
          style={{
            width: size,
            height: size,
            margin: "0 auto",
            borderRadius: 0,
            display: "grid",
            placeItems: "center",
            background: "transparent",
            color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(0,245,230,0.22)",
          }}
        >
          Enter an inscription ID, inscription number, or UTXO to preview it.
        </div>
      ) : null}

      {!loadingResolve && resolved?.ok ? (
            resolved.utxo ? (
     <UtxoViewer
  utxo={resolved.utxo ?? resolved.input}
  size={size}
  isPreview={isPreview}
  viewerOnly={viewerOnly}
  runtimeEnabled={runtimeEnabled}
  focusId={focusId}
  onInfoChange={onInfoChange}
/>
        ) : resolved.rootId || resolved.id ? (
          <ViewerFrame
            id={resolved.rootId ?? resolved.id}
            size={size}
            isPreview={isPreview}
          />
        ) : null
      ) : null}
    </div>
  );
}
