import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { createE2ePrismaClient } from "./helpers/prisma";
import { CURRENT_POLICY_VERSION } from "../src/lib/legal/policy";

const RUNTIME_CONFIG_PATH = path.join(__dirname, ".runtime-config.json");

export const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e@chattala.test";
export const E2E_USER_PASSWORD =
  process.env.E2E_USER_PASSWORD ?? "E2eSecure123!";
export const E2E_USERNAME = process.env.E2E_USERNAME ?? "e2e_playwright_user";

export default async function globalSetup() {
  const config: { dbReady: boolean; message?: string } = { dbReady: false };

  if (!process.env.DATABASE_URL) {
    config.message =
      "DATABASE_URL is not set — DB-backed tests (login) will be skipped.";
    fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(config));
    console.warn(`[e2e] ${config.message}`);
    return;
  }

  const prisma = createE2ePrismaClient();

  try {
    const passwordHash = await bcrypt.hash(E2E_USER_PASSWORD, 10);

    await prisma.user.upsert({
      where: { email: E2E_USER_EMAIL },
      update: {
        password: passwordHash,
        emailVerified: new Date(),
        deletedAt: null,
        suspendedAt: null,
        name: "E2E Test User",
        policyAcceptedAt: new Date(),
        policyVersion: CURRENT_POLICY_VERSION,
      },
      create: {
        email: E2E_USER_EMAIL,
        username: E2E_USERNAME,
        password: passwordHash,
        name: "E2E Test User",
        emailVerified: new Date(),
        mobile: "01712345678",
        location: "Panchlaish",
        dob: new Date("1995-06-15"),
        profession: "Not specified",
        policyAcceptedAt: new Date(),
        policyVersion: CURRENT_POLICY_VERSION,
      },
    });

    config.dbReady = true;
    config.message = `Seeded E2E user ${E2E_USER_EMAIL}`;
    console.log(`[e2e] ${config.message}`);
  } catch (error) {
    config.message =
      error instanceof Error ? error.message : "Failed to seed E2E user";
    console.error(`[e2e] ${config.message}`);
  } finally {
    await prisma.$disconnect();
    fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(config));
  }
}
