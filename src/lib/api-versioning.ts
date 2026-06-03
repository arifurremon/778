import { NextResponse } from "next/server";

export const API_VERSION = "v1";
export const API_SUNSET_DATE = "2026-12-31";

export function withLegacyApiDeprecationHeaders<T extends NextResponse>(response: T): T {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", new Date(API_SUNSET_DATE).toUTCString());
  response.headers.set("Link", '</api/v1>; rel="successor-version"');
  return response;
}

export function jsonWithLegacyDeprecation(data: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  return withLegacyApiDeprecationHeaders(response);
}
