import { db } from './src/lib/db.ts';

async function testConnection() {
  try {
    const userCount = await db.user.count();
    console.log('✅ Database connection is SUCCESSFUL!');
    console.log('Total users in database:', userCount);
  } catch (error) {
    console.error('❌ Database connection FAILED:');
    console.error(error);
  } finally {
    await db.$disconnect();
  }
}

testConnection();
