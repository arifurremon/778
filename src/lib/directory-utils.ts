import type {
  BusRoute,
  HeritagePerson,
  NewsOutlet,
  TourismSpot,
} from "@/lib/directory-data";

export type DirectoryType = "tourism" | "heritage" | "transport" | "news";

export interface DirectoryEntryRow {
  id: string;
  type: string;
  name: string;
  category: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export function mapTourismSpot(entry: DirectoryEntryRow): TourismSpot {
  const metadata = entry.metadata ?? {};
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    description: entry.description ?? "",
    image: String(metadata.image ?? "/city_background.png"),
    location: entry.address ?? String(metadata.location ?? ""),
    entryFee: String(metadata.entryFee ?? "Free"),
    timing: String(metadata.timing ?? ""),
  };
}

export function mapHeritagePerson(entry: DirectoryEntryRow): HeritagePerson {
  const metadata = entry.metadata ?? {};
  return {
    id: entry.id,
    name: entry.name,
    role: entry.category,
    lifespan: String(metadata.lifespan ?? ""),
    bio: entry.description ?? "",
    image: String(metadata.image ?? "/city_background.png"),
  };
}

export function mapBusRoute(entry: DirectoryEntryRow): BusRoute {
  const metadata = entry.metadata ?? {};
  return {
    id: entry.id,
    number: String(metadata.number ?? entry.name),
    origin: String(metadata.origin ?? ""),
    destination: String(metadata.destination ?? ""),
    route: Array.isArray(metadata.route) ? metadata.route.map(String) : [],
  };
}

export function mapNewsOutlet(entry: DirectoryEntryRow): NewsOutlet {
  const metadata = entry.metadata ?? {};
  return {
    id: entry.id,
    name: entry.name,
    logo: String(metadata.logo ?? "/city_background.png"),
    url: entry.website ?? String(metadata.url ?? ""),
    description: entry.description ?? "",
  };
}

export function mapDirectoryEntries(type: DirectoryType, entries: DirectoryEntryRow[]) {
  switch (type) {
    case "tourism":
      return entries.map(mapTourismSpot);
    case "heritage":
      return entries.map(mapHeritagePerson);
    case "transport":
      return entries.map(mapBusRoute);
    case "news":
      return entries.map(mapNewsOutlet);
    default:
      return entries;
  }
}
