import { defineConfig } from "drizzle-kit";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Auto-fallback for local development (outside Docker): 
// If you run drizzle-kit from host, it needs localhost. 
// If you run from inside docker-exec, it needs 'db'.
// We'll trust the DATABASE_URL from environment.

export default defineConfig({
  out: "./migrations",
  schema: ["./shared/schema.ts", "./shared/models/auth.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
