import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const openApiRegistry = new OpenAPIRegistry();

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export const RegisterBodySchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    username: z.string().min(3).max(30),
    password: z.string().min(6),
  })
  .openapi("RegisterBody");

export const OrderBodySchema = z
  .object({
    shopId: z.string().uuid(),
    productId: z.string().uuid(),
    phone: z.string(),
    address: z.string().min(1),
    quantity: z.number().int().positive().max(99).optional().default(1),
    note: z.string().optional(),
  })
  .openapi("CreateOrderBody");

export const BookingBodySchema = z
  .object({
    scheduledDate: z.string().datetime().optional(),
    address: z.string().min(5).optional(),
    notes: z.string().max(1000).optional(),
  })
  .openapi("CreateBookingBody");

export const ShopRegistrationBodySchema = z
  .object({
    name: z.string().min(2),
    description: z.string().min(10),
    category: z.string().min(1),
    location: z.string().min(1),
    payoutMethod: z.enum(["BKASH", "NAGAD", "BANK"]).optional(),
    registrationDetails: z.record(z.unknown()).optional(),
  })
  .openapi("ShopRegistrationBody");

export const ServiceRegistrationBodySchema = z
  .object({
    profession: z.string().min(2),
    category: z.string().min(1),
    location: z.string().min(1),
    experienceYears: z.number().int().min(0),
    fee: z.string().min(1),
    bio: z.string().min(20),
    qualifications: z.array(z.string()).min(1),
    payoutMethod: z.enum(["BKASH", "NAGAD", "BANK"]).optional(),
    registrationDetails: z.record(z.unknown()).optional(),
  })
  .openapi("ServiceRegistrationBody");

export const WebhookSubscriptionBodySchema = z
  .object({
    url: z.string().url(),
    events: z.array(z.string()).min(1),
  })
  .openapi("WebhookSubscriptionBody");

export const ApiKeyCreateBodySchema = z
  .object({
    name: z.string().min(2).max(80),
    scopes: z.array(z.string()).min(1),
    expiresInDays: z.number().int().min(1).max(365).optional(),
  })
  .openapi("ApiKeyCreateBody");

openApiRegistry.register("ErrorResponse", ErrorResponseSchema);

function registerPublicPaths(): void {
  const bearerAuth = openApiRegistry.registerComponent("securitySchemes", "BearerApiKey", {
    type: "http",
    scheme: "bearer",
    description: "Server-to-server API key (`tc_live_...`).",
  });

  const sessionAuth = openApiRegistry.registerComponent("securitySchemes", "SessionCookie", {
    type: "apiKey",
    in: "cookie",
    name: "authjs.session-token",
    description: "NextAuth session cookie after sign-in.",
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/health",
    tags: ["Platform"],
    summary: "Health check",
    responses: {
      200: {
        description: "Service healthy",
        content: {
          "application/json": {
            schema: z.object({
              status: z.enum(["ok", "degraded", "error"]),
              checks: z.record(z.object({ ok: z.boolean(), latencyMs: z.number().optional() })),
            }),
          },
        },
      },
    },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/v1/health",
    tags: ["Platform"],
    summary: "Health check (v1)",
    responses: { 200: { description: "Service healthy" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/auth/register",
    tags: ["Auth"],
    summary: "Register a new user",
    request: {
      body: { content: { "application/json": { schema: RegisterBodySchema } } },
    },
    responses: {
      201: { description: "User created" },
      400: { description: "Validation error", content: { "application/json": { schema: ErrorResponseSchema } } },
      409: { description: "Conflict", content: { "application/json": { schema: ErrorResponseSchema } } },
      429: { description: "Rate limited", content: { "application/json": { schema: ErrorResponseSchema } } },
    },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/shops",
    tags: ["Shops"],
    summary: "List shops",
    request: { query: PaginationQuerySchema.extend({ category: z.string().optional(), location: z.string().optional(), search: z.string().optional() }) },
    responses: { 200: { description: "Paginated shop list" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/shops",
    tags: ["Shops"],
    summary: "Register a shop",
    security: [{ [sessionAuth.name]: [] }],
    request: {
      headers: z.object({ "Idempotency-Key": z.string().optional() }).openapi({ description: "Optional idempotency key" }),
      body: { content: { "application/json": { schema: ShopRegistrationBodySchema } } },
    },
    responses: {
      201: { description: "Shop created" },
      409: { description: "Shop already exists", content: { "application/json": { schema: ErrorResponseSchema } } },
    },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/services",
    tags: ["Services"],
    summary: "List expert services",
    request: { query: PaginationQuerySchema.extend({ category: z.string().optional(), location: z.string().optional(), search: z.string().optional() }) },
    responses: { 200: { description: "Paginated services list" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/services",
    tags: ["Services"],
    summary: "Register expert service",
    security: [{ [sessionAuth.name]: [] }],
    request: {
      headers: z.object({ "Idempotency-Key": z.string().optional() }),
      body: { content: { "application/json": { schema: ServiceRegistrationBodySchema } } },
    },
    responses: { 201: { description: "Service created" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/orders",
    tags: ["Orders"],
    summary: "Create an order",
    security: [{ [sessionAuth.name]: [] }],
    request: {
      headers: z.object({ "Idempotency-Key": z.string().optional() }),
      body: { content: { "application/json": { schema: OrderBodySchema } } },
    },
    responses: { 201: { description: "Order created" } },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/orders",
    tags: ["Orders"],
    summary: "List buyer orders",
    security: [{ [sessionAuth.name]: [] }],
    responses: { 200: { description: "Paginated orders" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/services/{expertId}/bookings",
    tags: ["Bookings"],
    summary: "Book an expert service",
    security: [{ [sessionAuth.name]: [] }],
    request: {
      params: z.object({ expertId: z.string().uuid() }),
      headers: z.object({ "Idempotency-Key": z.string().optional() }),
      body: { content: { "application/json": { schema: BookingBodySchema } } },
    },
    responses: { 201: { description: "Booking created" } },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/directory",
    tags: ["Directory"],
    summary: "Public directory entries",
    responses: { 200: { description: "Directory list" } },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/emergency",
    tags: ["Directory"],
    summary: "Emergency contacts",
    responses: { 200: { description: "Emergency contacts list" } },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/webhooks",
    tags: ["Webhooks"],
    summary: "List webhook subscriptions",
    security: [{ [sessionAuth.name]: [] }, { [bearerAuth.name]: ["read:webhooks"] }],
    responses: { 200: { description: "Subscriptions" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/webhooks",
    tags: ["Webhooks"],
    summary: "Create webhook subscription",
    security: [{ [sessionAuth.name]: [] }, { [bearerAuth.name]: ["write:webhooks"] }],
    request: { body: { content: { "application/json": { schema: WebhookSubscriptionBodySchema } } } },
    responses: { 201: { description: "Subscription created" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/webhooks/test",
    tags: ["Webhooks"],
    summary: "Send test ping webhook",
    security: [{ [sessionAuth.name]: [] }],
    responses: { 202: { description: "Test delivery queued" } },
  });

  openApiRegistry.registerPath({
    method: "get",
    path: "/api/user/api-keys",
    tags: ["API Keys"],
    summary: "List API keys",
    security: [{ [sessionAuth.name]: [] }],
    responses: { 200: { description: "API keys (prefix only)" } },
  });

  openApiRegistry.registerPath({
    method: "post",
    path: "/api/user/api-keys",
    tags: ["API Keys"],
    summary: "Create API key",
    security: [{ [sessionAuth.name]: [] }],
    request: { body: { content: { "application/json": { schema: ApiKeyCreateBodySchema } } } },
    responses: { 201: { description: "API key created (raw key shown once)" } },
  });
}

registerPublicPaths();

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(openApiRegistry.definitions);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://www.thechattala.com"
      : "http://localhost:9002");

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "The Chattala API",
      version: "1.0.0",
      description:
        "Public and integration endpoints for The Chattala. Prefer `/api/v1/*` for new integrations. OpenAPI is the single source of truth; see `/api/docs` for interactive reference.",
      contact: {
        name: "The Chattala API Support",
        url: baseUrl,
      },
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "Platform" },
      { name: "Auth" },
      { name: "Shops" },
      { name: "Services" },
      { name: "Orders" },
      { name: "Bookings" },
      { name: "Directory" },
      { name: "Webhooks" },
      { name: "API Keys" },
    ],
  });
}
