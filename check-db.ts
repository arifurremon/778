import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./src/lib/db";

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Exists" : "MISSING");
  try {
    const users = await db.user.findMany({
      take: 5,
      select: { email: true, username: true }
    });
    console.log("Users in DB:", users);
  } catch (e) {
    console.error("Error connecting to DB:", e);
  } finally {
    process.exit();
  }
}

main();
