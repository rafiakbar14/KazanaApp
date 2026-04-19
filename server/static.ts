import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Compatibility for both ESM and CJS
const _filename = typeof import.meta.url !== 'undefined' ? fileURLToPath(import.meta.url) : __filename;
const _dirname = path.dirname(_filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(_dirname, "..", "dist", "public");
  // Check common locations for dist
  const possiblePaths = [
    distPath,
    path.resolve(_dirname, "public"),
    path.resolve(process.cwd(), "dist", "public")
  ];

  let finalPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      finalPath = p;
      break;
    }
  }

  if (!finalPath) {
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}`,
    );
  }

  app.use(express.static(finalPath));

  // Handle any unhandled /api/* routes first to return JSON 404 instead of index.html
  // Using RegExp for absolute compatibility with Express 5+
  app.all(/^\/api\/.*/, (req, res) => {
    res.status(404).json({
      message: `API Route ${req.method} ${req.path} not found`,
      error: "Not Found"
    });
  });

  // Fallback all other routes to index.html for SPA routing
  app.use((_req, res) => {
    res.sendFile(path.resolve(finalPath, "index.html"));
  });
}
