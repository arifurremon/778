import { cachedQuery } from "@/lib/cache";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  mapDirectoryEntries,
  type DirectoryEntryRow,
  type DirectoryType,
} from "@/lib/directory-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { getClientIp } from "@/lib/request-ip";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = new Set<DirectoryType>(["tourism", "heritage", "transport", "news"]);

// GET /api/directory — public directory entries by type
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.publicRead, getClientIp(req)),
      "DirectoryRead"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const typeParam = (req.nextUrl.searchParams.get("type") ?? "tourism") as DirectoryType;
    const type = VALID_TYPES.has(typeParam) ? typeParam : "tourism";
    const search = req.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? "";

    const fetchEntries = async () => {
      const entries = await db.directoryEntry.findMany({
        where: { type },
        orderBy: { name: "asc" },
      });
      const mapped = mapDirectoryEntries(type, entries as DirectoryEntryRow[]);
      return mapped.filter((entry) => {
        if (!search) return true;
        return JSON.stringify(entry).toLowerCase().includes(search);
      });
    };

    const filtered = isFeatureEnabled("redisCacheDirectory")
      ? await cachedQuery(`type:${type}:search:${search}`, fetchEntries, 600, "directory")
      : await fetchEntries();

    return NextResponse.json({ type, entries: filtered });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/directory]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
