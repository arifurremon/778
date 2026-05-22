import { db } from "../src/lib/db";

async function checkUsers() {
  try {
    const count = await db.user.count();
    const users = await db.user.findMany({
      select: { email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n=== DATABASE REPORT ===`);
    console.log(`Total Registered Users: ${count}`);
    console.log(`\nMost Recent 5 Users:`);
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.name} (${u.email}) - Created: ${u.createdAt}`);
    });
    console.log(`=======================\n`);
    
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
