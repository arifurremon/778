/**
 * NextAuth.js v5 API route handler.
 *
 * This is the sole entry point for all Auth.js HTTP traffic:
 *   GET  /api/auth/*  — sign-in page redirects, CSRF token, session, providers
 *   POST /api/auth/*  — sign-in, sign-out, callback endpoints
 *
 * `handlers` is the NextAuth handler object produced in src/lib/auth.ts.
 * GET and POST are destructured here and re-exported as Next.js App Router
 * route handlers. This is the only file in the codebase that should export
 * HTTP verb handlers for the /api/auth/* namespace.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
