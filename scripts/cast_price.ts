import { db } from '../src/lib/db';

async function main() {
  console.log('Running manual migrations...');
  
  try {
    // Cast price
    await db.$executeRawUnsafe(`ALTER TABLE "Product" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::DECIMAL`);
    console.log('Successfully cast price to DECIMAL');
    
    // Cast originalPrice
    await db.$executeRawUnsafe(`ALTER TABLE "Product" ALTER COLUMN "originalPrice" TYPE DECIMAL(10,2) USING NULLIF("originalPrice", '')::DECIMAL`);
    console.log('Successfully cast originalPrice to DECIMAL');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
