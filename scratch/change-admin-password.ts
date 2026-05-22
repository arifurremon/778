import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: npx tsx --env-file=.env.local scratch/change-admin-password.ts <email> <new_password>");
    process.exit(1);
  }

  try {
    console.log(`Hashing new password for ${email}...`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`Updating database...`);
    const user = await db.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Password successfully updated for ${user.email}!`);
  } catch (error: any) {
    console.error("❌ Failed to update password. Are you sure the email is correct?");
    console.error("Error details:", error.message);
  } finally {
    process.exit(0);
  }
}

main();
