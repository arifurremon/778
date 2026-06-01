import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as ws from 'ws';

dotenv.config({ path: '.env.local' });

function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return new PrismaClient({
      log: ["error"],
    });
  }

  const url = connectionString.replace(/&?channel_binding=require/g, "");
  
  // Setup WebSocket for Neon
  neonConfig.webSocketConstructor = ws.default || ws;
  
  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = getPrismaClient();

async function main() {
  console.log("🌱 Starting Admin and Settings Seed...");

  // 1. Check or Create Default Settings
  // SCHEMA-FALLBACK: 'settings' may not exist if migration hasn't run
  try {
    // @ts-ignore
    if (prisma.settings) {
      // @ts-ignore
      const existingSettings = await prisma.settings.findUnique({
        where: { id: "global" }
      });

      if (!existingSettings) {
        // @ts-ignore
        await prisma.settings.create({
          data: {
            id: "global",
            siteName: "The Chattala",
            siteDescription: "A hyper-local community platform",
            contactEmail: "support@thechattala.com",
            maintenanceMode: false,
            registrationOpen: true,
            emailVerificationReq: true,
            featuresEnabled: { "shops": true, "services": true, "posts": true },
            defaultPostVisibility: "PUBLIC"
          }
        });
        console.log("✅ Global settings initialized.");
      } else {
        console.log("⏭️ Global settings already exist. Skipping.");
      }
    } else {
      console.warn("⚠️ Settings model not found in Prisma Client. Did you run the migration?");
    }
  } catch (error) {
    console.error("❌ Failed to seed settings:", error);
  }

  // 2. Check or Create Super Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@thechattala.com";
  const defaultPassword = process.env.ADMIN_PASSWORD;
  if (!defaultPassword) {
    throw new Error(
      "ADMIN_PASSWORD must be set in the environment before running seed-admin.ts"
    );
  }
  
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "System Admin",
          preferredName: "Admin",
          isAdmin: true,
          isVerified: true,
          registrationStatus: "APPROVED"
        }
      });
      
      console.log("✅ Super Admin user created.");
      console.log("-----------------------------------------");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${defaultPassword}`);
      console.log("⚠️ IMPORTANT: Change this password immediately after login!");
      console.log("-----------------------------------------");
    } else {
      // Ensure the existing user is an admin
      if (!existingAdmin.isAdmin) {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { isAdmin: true }
        });
        console.log(`✅ Promoted existing user ${adminEmail} to Admin.`);
      } else {
        console.log("⏭️ Super Admin already exists. Skipping.");
      }
    }
  } catch (error) {
    console.error("❌ Failed to seed admin user:", error);
  }

  console.log("🎉 Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
