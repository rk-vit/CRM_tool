import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined'+ process.env.DATABASE_URL);
}

export const sql = neon(process.env.DATABASE_URL);
