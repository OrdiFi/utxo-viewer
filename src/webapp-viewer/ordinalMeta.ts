import { viewerApiFetch } from "./viewerApi";

export type OrdifiSide =
  | "front"
  | "back"
  | null;

async function fetchHeadText(
  inscriptionId: string,
  bytes = 131072,
): Promise<string> {
  const res = await viewerApiFetch(
    `/api/inscription/${inscriptionId}?raw=1`,
    {
      headers: {
        Range: `bytes=0-${bytes - 1}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(
      `Could not read inscription metadata (${res.status}).`,
    );
  }

  return await res.text();
}

function parseSide(
  html: string,
): OrdifiSide {
  const match = html.match(
    /<meta\s+name=["']ordifi:side["']\s+content=["']([^"']+)["']/i,
  );

  const value =
    match?.[1]?.trim().toLowerCase() ?? null;

  if (value === "front") return "front";
  if (value === "back") return "back";

  return null;
}

export async function detectOrdifiMeta(
  inscriptionId: string,
): Promise<{
  side: OrdifiSide;
}> {
  try {
    const html =
      await fetchHeadText(inscriptionId);

    return {
      side: parseSide(html),
    };
  } catch {
    return {
      side: null,
    };
  }
}
