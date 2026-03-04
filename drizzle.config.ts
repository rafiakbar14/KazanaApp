import { defineConfig } from "drizzle-kit";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Auto-fallback for local development: if hostname is "db" but we're not inside Docker/Production
if (process.env.NODE_ENV !== 'production' && databaseUrl.includes('@db:')) {
  databaseUrl = databaseUrl.replace('@db:', '@localhost:');
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
