/** Public neighbour profile returned by GET /api/neighbours */
export interface NeighbourConnectionUser {
  id: string;
  name: string | null;
  preferredName: string | null;
  username: string | null;
  profileImage: string | null;
  isVerified: boolean;
  location: string | null;
  connectionId: string;
  connectedSince: string;
}

/** Pending request row returned by GET /api/neighbours/requests */
export interface NeighbourRequestRow {
  id: string;
  sender: Omit<NeighbourConnectionUser, "connectionId" | "connectedSince" | "isVerified">;
}

export interface NeighboursListResponse {
  neighbours: NeighbourConnectionUser[];
}

export interface NeighbourRequestsResponse {
  requests: NeighbourRequestRow[];
}
