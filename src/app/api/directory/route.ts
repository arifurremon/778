import {
  mapDirectoryEntries,
  type DirectoryEntryRow,
  type DirectoryType,
} from "@/lib/directory-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = new Set<DirectoryType>(["tourism", "heritage", "transport", "news"]);

// GET /api/directory — public directory entries by type
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const typeParam = (req.nextUrl.searchParams.get("type") ?? "tourism") as DirectoryType;
    const type = VALID_TYPES.has(typeParam) ? typeParam : "tourism";
    const search = req.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? "";

    const entries = await db.directoryEntry.findMany({
      where: { type },
      orderBy: { name: "asc" },
    });

    const mapped = mapDirectoryEntries(type, entries as DirectoryEntryRow[]);
    const filtered = mapped.filter((entry) => {
      if (!search) return true;
      return JSON.stringify(entry).toLowerCase().includes(search);
    });

    return NextResponse.json({ type, entries: filtered });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/directory]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
