import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool, // Use the shared pool
    createTableIfMissing: false, // Table is managed by Drizzle in shared/models/auth.ts
    ttl: sessionTtl / 1000,
    tableName: "sessions",
  });
  const secret = process.env.SESSION_SECRET || "kazana-default-fallback-secret-2024";
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    console.warn("[auth] WARNING: SESSION_SECRET is missing! Using fallback. Please check your .env file.");
  }

  return session({
    secret: secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false because VPS uses HTTP via IP address
      maxAge: sessionTtl,
    },
  });

}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if ((req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
