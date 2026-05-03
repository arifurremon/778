import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// prisma CLI runs outside Next.js, so .env.local is not auto-loaded
dotenv.config({ path: '.env.local' });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-ignore
    directUrl: process.env.DIRECT_URL,
  },
});
