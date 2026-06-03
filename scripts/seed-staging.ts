/**
 * Staging seed — idempotent demo data for users, shops, posts, directory.
 * Usage: DATABASE_URL=... npm run seed:staging
 */
import bcrypt from "bcryptjs";
import { seedDirectoryEntries, seedEmergencyContacts } from "./seed-phase3-content";
import { db } from "../src/lib/db";
import { CURRENT_POLICY_VERSION } from "../src/lib/legal/policy";

const STAGING_PASSWORD = process.env.STAGING_SEED_PASSWORD ?? "StagingSecure123!";

async function upsertStagingUser(input: {
  email: string;
  username: string;
  name: string;
  location: string;
  isAdmin?: boolean;
  isSeller?: boolean;
}) {
  const passwordHash = await bcrypt.hash(STAGING_PASSWORD, 12);
  const now = new Date();

  return db.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      username: input.username,
      password: passwordHash,
      name: input.name,
      mobile: "01712345678",
      location: input.location,
      dob: new Date("1995-01-15"),
      profession: "Not specified",
      emailVerified: now,
      policyAcceptedAt: now,
      policyVersion: CURRENT_POLICY_VERSION,
      isAdmin: input.isAdmin ?? false,
      isSeller: input.isSeller ?? false,
    },
    update: {
      name: input.name,
      location: input.location,
      emailVerified: now,
      policyAcceptedAt: now,
      policyVersion: CURRENT_POLICY_VERSION,
      isAdmin: input.isAdmin ?? false,
      isSeller: input.isSeller ?? false,
    },
  });
}

async function seedUsersAndShops() {
  const admin = await upsertStagingUser({
    email: process.env.STAGING_ADMIN_EMAIL ?? "staging-admin@thechattala.test",
    username: "staging_admin",
    name: "Staging Admin",
    location: "Panchlaish",
    isAdmin: true,
  });

  const seller = await upsertStagingUser({
    email: "staging-seller@thechattala.test",
    username: "staging_seller",
    name: "Staging Seller",
    location: "Halishahar",
    isSeller: true,
  });

  const citizen = await upsertStagingUser({
    email: "staging-user@thechattala.test",
    username: "staging_user",
    name: "Staging Citizen",
    location: "Agrabad",
  });

  const shop = await db.shop.upsert({
    where: { userId: seller.id },
    create: {
      userId: seller.id,
      name: "Staging Chattala Mart",
      description: "Demo shop for staging marketplace flows.",
      category: "Groceries",
      location: "Halishahar",
      isVerified: true,
      verifiedAt: new Date(),
    },
    update: {
      name: "Staging Chattala Mart",
      isVerified: true,
    },
  });

  await db.product.upsert({
    where: { id: "staging-product-rice" },
    create: {
      id: "staging-product-rice",
      shopId: shop.id,
      name: "Premium Basmati Rice (5kg)",
      description: "Staging catalog item for order smoke tests.",
      price: 850,
      category: "Groceries",
      inStock: true,
      images: [],
    },
    update: {
      name: "Premium Basmati Rice (5kg)",
      inStock: true,
    },
  });

  await db.post.upsert({
    where: { id: "staging-post-welcome" },
    create: {
      id: "staging-post-welcome",
      authorId: citizen.id,
      content: "Welcome to The Chattala staging environment! This is seeded demo content.",
      visibility: "PUBLIC",
      moderationStatus: "APPROVED",
    },
    update: {
      content: "Welcome to The Chattala staging environment! This is seeded demo content.",
    },
  });

  console.log("Users:", { admin: admin.email, seller: seller.email, citizen: citizen.email });
  console.log("Shop:", shop.name);
}

async function seedDirectoryContent() {
  await seedEmergencyContacts();
  await seedDirectoryEntries();
}

async function main() {
  console.log("🌱 Seeding staging database...");
  await seedUsersAndShops();
  await seedDirectoryContent();
  console.log("✅ Staging seed complete.");
  console.log(`Default password for staging users: ${STAGING_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
