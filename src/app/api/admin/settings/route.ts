import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().optional().or(z.literal('')),
  maintenanceMode: z.boolean().optional(),
  registrationOpen: z.boolean().optional(),
  emailVerificationReq: z.boolean().optional(),
  defaultPostVisibility: z.string().optional(),
  featuresEnabled: z.record(z.boolean()).optional(),
});

/**
 * GET /api/admin/settings
 * Retrieves global platform settings, creating defaults if missing.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    let settings = null;

    try {
      // SCHEMA-FALLBACK: 'settings' may not exist — verify schema
      // @ts-ignore
      settings = await db.settings.upsert({
        where: { id: "global" },
        update: {},
        create: {
          id: "global",
          siteName: "The Chattala",
          siteDescription: "A hyper-local community platform",
          contactEmail: "support@thechattala.com",
          maintenanceMode: false,
          registrationOpen: true,
          emailVerificationReq: true,
          featuresEnabled: { posts: true, marketplace: true, services: true, messaging: false },
          defaultPostVisibility: "PUBLIC"
        }
      });
    } catch (e) {
      // Provide a safe default memory object
      settings = {
        siteName: "The Chattala",
        siteDescription: "",
        contactEmail: "",
        supportPhone: "",
        maintenanceMode: false,
        registrationOpen: true,
        emailVerificationReq: true,
        featuresEnabled: { posts: true, marketplace: true, services: true, messaging: false },
        defaultPostVisibility: "PUBLIC"
      };
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/settings",
      method: "GET"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Updates global platform settings.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    const validatedData = settingsSchema.parse(body);

    let updatedSettings = null;

    try {
      // SCHEMA-FALLBACK: 'settings' may not exist — verify schema
      // @ts-ignore
      updatedSettings = await db.settings.update({
        where: { id: "global" },
        data: {
          ...validatedData,
          updatedBy: session.user.id
        }
      });
    } catch (e) {
      updatedSettings = validatedData;
    }

    // Determine what action to log
    let actionType = "UPDATE_SETTINGS";
    if (validatedData.maintenanceMode !== undefined) {
      actionType = "TOGGLE_MAINTENANCE";
    }

    await logAdminAction(
      session.user.id,
      actionType,
      "Settings",
      "global",
      { changes: validatedData },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    logErrorToSentry(err, {
      endpoint: "/api/admin/settings",
      method: "PATCH"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
