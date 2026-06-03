import { db } from "@/lib/db";

const DEFAULT_SUPPORT_EMAIL = "support@thechattala.com";

export async function getSupportContactEmail(): Promise<string> {
  try {
    const settings = await db.settings.findUnique({
      where: { id: "global" },
      select: { contactEmail: true },
    });

    const email = settings?.contactEmail?.trim();
    return email && email.includes("@") ? email : DEFAULT_SUPPORT_EMAIL;
  } catch {
    return DEFAULT_SUPPORT_EMAIL;
  }
}
