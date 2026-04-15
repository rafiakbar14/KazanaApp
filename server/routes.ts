import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { authStorage } from "./auth/storage";
import archiver from "archiver";
import { productPhotos, opnameRecordPhotos, users, userRoles, accounts, journalEntries, journalItems, posDevices, posRegistrationCodes, promotions, saleItems, sales, products, customers, opnameRecords, posPettyCash, inboundSessions, inboundItems, outboundSessions, outboundItems, opnameSessions } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, or, sql } from "drizzle-orm";
import { storageService } from "./lib/storage-provider";
import { processBackup } from "../scripts/backup-gdrive";
import { execSync } from "child_process";
import { moduleSubscriptions } from "@shared/schema";
import { createTransactionToken, verifyWebhookSignature } from "./lib/midtrans";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateBusinessInsights, generateProductionAdvice } from "./ai";


const upload = multer({ dest: path.join(os.tmpdir(), "kazana-uploads"), limits: { fileSize: 50 * 1024 * 1024 } });

async function uploadToObjectStorage(file: Express.Multer.File): Promise<string> {
  const fileBuffer = fs.readFileSync(file.path);
  const url = await storageService.uploadFile(
    fileBuffer,
    file.originalname,
    file.mimetype || "application/octet-stream"
  );
  fs.unlinkSync(file.path);
  return url;
}

function getUserId(req: Request): string {
  return (req.session as any)?.userId;
}

async function getTeamAdminId(req: Request): Promise<string> {
  const userId = getUserId(req);
  const user = await authStorage.getUser(userId);
  if (user?.adminId) {
    return user.adminId;
  }
  return userId;
}

async function getUserRole(req: Request) {
  const userId = getUserId(req);
  if (!userId) return "stock_counter";

  const user = await authStorage.getUser(userId);
  // User yang tidak punya adminId adalah Owner/Admin utama
  if (user && !user.adminId) return "admin";

  const roleRecord = await storage.getUserRole(userId);
  return roleRecord?.role || "stock_counter";
}

function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: Function) => {
    const role = await getUserRole(req);
    if (roles.includes(role)) {
      return next();
    }
    res.status(403).json({ message: "Anda tidak memiliki akses untuk fitur ini" });
  };
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);
  registerAuthRoutes(app);

  // === Diagnostic ===
  app.get("/api/diag", async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok", database: "connected", time: new Date().toISOString() });
    } catch (e) {
      res.status(500).json({ status: "error", database: "disconnected", message: (e as Error).message });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Server is alive", time: new Date().toISOString() });
  });

  // === Activity Logs ===
  app.get("/api/admin/logs", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = getUserId(req);
      const branchIdStr = req.query.branchId as string;
      const branchId = branchIdStr ? parseInt(branchIdStr) : undefined;

      const logs = await storage.getActivityLogs(adminId, branchId);
      res.json(logs);
    } catch (error) {
      console.error("Fetch logs error:", error);
      res.status(500).json({ message: "Gagal mengambil log aktivitas" });
    }
  });

  app.post("/api/admin/user/branch", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { userId, branchId } = req.body;
      if (!userId || branchId === undefined) {
        return res.status(400).json({ message: "UserId dan branchId wajib diisi" });
      }

      const adminId = getUserId(req);
      const targetUser = await authStorage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      // Verifikasi bahwa user adalah anggota tim
      if (targetUser.adminId !== adminId) {
        return res.status(403).json({ message: "Anda hanya bisa merubah cabang anggota tim Anda" });
      }

      await authStorage.updateUser(userId, { branchId: parseInt(branchId) });

      await storage.createActivityLog({
        userId: adminId,
        action: "UPDATE_USER_BRANCH",
        details: `Updated branch for user @${targetUser.username} to branch #${branchId}`,
        branchId: targetUser.branchId || 1
      });

      res.json({ message: "Cabang user berhasil diperbarui" });
    } catch (error) {
      console.error("Update branch error:", error);
      res.status(500).json({ message: "Gagal memperbarui cabang" });
    }
  });

  console.log("[server] Registering diagnostic route: /api/diag/db (Secured)");
  app.get("/api/diag/db", isAuthenticated, requireRole("admin"), async (req, res) => {
    const { pool } = await import("./db");
    const { users } = await import("@shared/models/auth");
    const { userRoles } = await import("@shared/schema");
    try {
      const client = await pool.connect();
      const dbRes = await client.query("SELECT NOW()");

      // Check tables
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableNames = tablesRes.rows.map(r => r.table_name);

      let userCount = -1;
      let opnameCols: string[] = [];
      if (tableNames.includes("users")) {
        const countRes = await client.query("SELECT COUNT(*) FROM users");
        userCount = parseInt(countRes.rows[0].count);
      }
      if (tableNames.includes("opname_records")) {
        const colsRes = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'opname_records'
        `);
        opnameCols = colsRes.rows.map(r => r.column_name);
      }

      client.release();
      res.json({
        status: "ok",
        time: dbRes.rows[0].now,
        tables: tableNames,
        opnameColumns: opnameCols,
        userCount,
        env: {
          hasSupabase: !!process.env.SUPABASE_DATABASE_URL,
          hasLocal: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          // Masked connection string for debugging
          dbUrl: ((await import("./db")).pool as any).options?.connectionString?.replace(/:([^:@]+)@/, ":****@") || "hidden",
        }
      });
    } catch (err: any) {
      console.error("Diagnostic error:", err);
      res.status(500).json({
        status: "error",
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  });

  // === Roles ===
  app.get(api.roles.me.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    let roleRecord = await storage.getUserRole(userId);
    if (!roleRecord) {
      roleRecord = await storage.setUserRole({ userId, role: "stock_counter" });
    }

    // Fetch gDriveRemote from users table
    const user = await authStorage.getUser(userId);

    res.json({
      ...roleRecord,
      gDriveRemote: user?.gDriveRemote || null
    });
  });

  app.get(api.roles.list.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    const adminId = getUserId(req);
    const roles = await storage.getAllUserRoles();
    const { users } = await import("@shared/models/auth");
    const { db } = await import("./db");
    const { eq, or } = await import("drizzle-orm");
    const allUsers = await db.select().from(users).where(
      or(eq(users.id, adminId), eq(users.adminId, adminId))
    );

    const teamUserIds = new Set(allUsers.map(u => u.id));
    const teamRoles = roles.filter(r => teamUserIds.has(r.userId));

    const enriched = teamRoles.map(r => {
      const user = allUsers.find(u => u.id === r.userId);
      return {
        ...r,
        username: user?.username,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        adminId: user?.adminId,
      };
    });
    res.json(enriched);
  });

  app.post(api.roles.set.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const input = api.roles.set.input.parse(req.body);
      const adminId = getUserId(req);

      const { users } = await import("@shared/models/auth");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const [targetUser] = await db.select().from(users).where(eq(users.id, input.userId));

      if (!targetUser || (targetUser.id !== adminId && targetUser.adminId !== adminId)) {
        return res.status(403).json({ message: "Anda tidak bisa mengubah role user ini" });
      }

      if (targetUser.id === adminId) {
        return res.status(400).json({ message: "Tidak bisa mengubah role sendiri" });
      }

      const role = await storage.setUserRole(input);

      await storage.createActivityLog({
        userId: adminId,
        action: "SET_USER_ROLE",
        details: `Changed role for user @${targetUser.username} to ${input.role}`,
        branchId: targetUser.branchId || 1,
        ipAddress: req.ip
      });

      res.json(role);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Products ===
  app.get(api.products.categories.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const prods = await storage.getProducts(adminId);
    const cats = Array.from(new Set(prods.map(p => p.category).filter(Boolean))) as string[];
    res.json(cats);
  });

  app.get(api.products.withDetails.path, isAuthenticated, requireRole("admin", "sku_manager", "production"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const result = await storage.getProductsWithPhotosAndUnits(adminId);
    res.json(result);
  });

  app.get(api.products.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const locationType = req.query.locationType as string | undefined;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const role = await getUserRole(req);

    let effectiveLocationType = locationType;
    if (role === "stock_counter_toko") effectiveLocationType = "toko";
    if (role === "stock_counter_gudang") effectiveLocationType = "gudang";

    const prods = await storage.getProducts(adminId, effectiveLocationType, branchId);

    // === Security: Field Level Sanitization ===
    // Jangan kirim unit_cost (harga modal) ke staff non-admin/sku_manager
    const sensitiveRoles = ["admin", "sku_manager"];
    if (!sensitiveRoles.includes(role)) {
      const safeProds = prods.map(p => {
        const { unitCost: _, ...safeProd } = p;
        return safeProd;
      });
      return res.json(safeProds);
    }

    res.json(prods);
  });

  app.post(api.products.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const product = await storage.createProduct({ ...input, userId: adminId });
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const adminId = await getTeamAdminId(req);
      const existing = await storage.getProduct(id);
      if (!existing || existing.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(id, input);
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete(api.products.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const existing = await storage.getProduct(Number(req.params.id));
    if (!existing || existing.userId !== adminId) {
      return res.status(404).json({ message: "Product not found" });
    }
    await storage.deleteProduct(Number(req.params.id));
    res.sendStatus(204);
  });

  app.post(api.products.bulkDelete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const { ids } = req.body as { ids: number[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided" });
    }
    const deleted = await storage.bulkDeleteProducts(ids, adminId as string);

    await storage.createActivityLog({
      userId: adminId as string,
      action: "BULK_DELETE_PRODUCTS",
      details: `Permanently deleted ${deleted} products`,
      ipAddress: req.ip
    });

    res.json({ deleted });
  });

  app.post(api.products.bulkResetStock.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const { ids } = req.body as { ids: number[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided" });
    }

    console.log(`Resetting stock for ${ids.length} products by admin ${adminId}`);
    await storage.bulkResetStock(ids, adminId as string);
    res.json({ reset: ids.length });
  });

  // === Product Photos (multi-photo support) ===
  app.get(api.productPhotos.list.path, isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    const photos = await storage.getProductPhotos(productId);
    res.json(photos);
  });

  app.post(api.productPhotos.upload.path, isAuthenticated, requireRole("admin", "sku_manager"), upload.single("photo"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);
      const photo = await storage.addProductPhoto({ productId, url });

      res.status(201).json(photo);
    } catch (err) {
      console.error("Product photo upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.delete(api.productPhotos.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const photoId = Number(req.params.photoId);
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProductPhoto(photoId);
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete photo error:", err);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // === Product Units (unit beranak) ===
  app.get(api.productUnits.list.path, isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    const units = await storage.getProductUnits(productId);
    res.json(units);
  });

  app.post(api.productUnits.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      const { unitName, conversionToBase, baseUnit, sortOrder } = req.body;
      if (!unitName || !baseUnit) {
        return res.status(400).json({ message: "unitName and baseUnit are required" });
      }

      const unit = await storage.addProductUnit({
        productId,
        unitName,
        conversionToBase: conversionToBase || 1,
        baseUnit,
        sortOrder: sortOrder || 0,
      });
      res.status(201).json(unit);
    } catch (err) {
      console.error("Create unit error:", err);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.put(api.productUnits.update.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const unitId = Number(req.params.unitId);
      const adminId = await getTeamAdminId(req);
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      const { unitName, conversionToBase, baseUnit, sortOrder } = req.body;
      const unit = await storage.updateProductUnit(unitId, {
        unitName,
        conversionToBase,
        baseUnit,
        sortOrder,
      });
      res.json(unit);
    } catch (err) {
      console.error("Update unit error:", err);
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  app.delete(api.productUnits.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const unitId = Number(req.params.unitId);
      const adminId = await getTeamAdminId(req);
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProductUnit(unitId);
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete unit error:", err);
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // === Photo Upload (legacy single photo) ===
  app.post(api.upload.photo.path, isAuthenticated, requireRole("admin", "sku_manager"), upload.single("photo"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);
      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);
      await storage.updateProduct(productId, { photoUrl: url });
      res.json({ url });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.post(api.upload.storeLogo.path, isAuthenticated, requireRole("admin"), upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);
      res.json({ url });
    } catch (err) {
      console.error("Store logo upload error:", err);
      res.status(500).json({ message: "Gagal mengunggah logo toko" });
    }
  });

  // === Opname Photo Upload (legacy single photo) ===
  app.post(api.upload.opnamePhoto.path, isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);

      const session = await storage.getSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);
      await storage.updateRecordPhoto(sessionId, productId, url);
      res.json({ url });
    } catch (err) {
      console.error("Opname photo upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // === Opname Record Photos (multi-photo for SO) ===
  app.post(api.recordPhotos.upload.path, isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);

      const session = await storage.getSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      const product = await storage.getProduct(productId);
      if (!product || product.userId !== adminId) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);

      const record = session.records.find(r => r.productId === productId);

      if (record) {
        const recordPhoto = await storage.addRecordPhoto({ recordId: record.id, url });
        await storage.updateRecordPhoto(sessionId, productId, url);
        res.status(201).json(recordPhoto);
      } else {
        await storage.updateRecordPhoto(sessionId, productId, url);
        res.status(201).json({ url });
      }
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: (err as Error).message || "Upload failed" });
    }
  });

  app.delete(api.recordPhotos.delete.path, isAuthenticated, async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const photoId = Number(req.params.photoId);
      const adminId = await getTeamAdminId(req);

      const session = await storage.getSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      await storage.deleteRecordPhoto(photoId);
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete record photo error:", err);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.post(api.inbound.uploadPhoto.path, isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const { sessionId, itemId } = req.params;
      const adminId = await getTeamAdminId(req);

      const session = await storage.getInboundSession(Number(sessionId));
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);
      const photo = await storage.addInboundItemPhoto(Number(itemId), url);
      res.status(201).json(photo);
    } catch (err) {
      console.error("Inbound photo upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.delete(api.recordPhotos.delete.path, isAuthenticated, async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const productId = Number(req.params.productId);
      const photoId = Number(req.params.photoId);
      const adminId = await getTeamAdminId(req);

      const session = await storage.getSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      await storage.deleteRecordPhoto(photoId);
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete record photo error:", err);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // === Download ZIP Photos ===
  app.post(api.upload.downloadZip.path, isAuthenticated, async (req, res) => {
    try {
      const sessionId = Number(req.params.id);
      const adminId = await getTeamAdminId(req);

      const session = await storage.getSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      const { productIds, date } = req.body as { productIds?: number[]; date?: string };

      let recordsToDownload = session.records;

      if (productIds && productIds.length > 0) {
        recordsToDownload = recordsToDownload.filter(r => productIds.includes(r.productId));
      }

      if (date) {
        const targetDate = new Date(date);
        const targetDateStr = targetDate.toISOString().split("T")[0];
        recordsToDownload = recordsToDownload.filter(r => {
          if (r.photos && r.photos.length > 0) {
            return r.photos.some(p => {
              const photoDate = new Date(p.createdAt).toISOString().split("T")[0];
              return photoDate === targetDateStr;
            });
          }
          return false;
        });
      }

      const recordsWithPhotos = recordsToDownload.filter(r => {
        return (r.photos && r.photos.length > 0) || r.photoUrl;
      });

      if (recordsWithPhotos.length === 0) {
        return res.status(404).json({ message: "Tidak ada foto untuk didownload" });
      }

      const safeTitle = session.title.replace(/[^a-zA-Z0-9]/g, "_");
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=${safeTitle}_Photos.zip`);

      const archive = archiver("zip", { zlib: { level: 5 } });
      archive.pipe(res);

      for (const record of recordsWithPhotos) {
        const safeName = record.product.name.replace(/[^a-zA-Z0-9]/g, "_");

        const appendPhotoToArchive = async (photoUrl: string, zipFilename: string) => {
          if (photoUrl.startsWith("http")) {
            // Fetch from Supabase public URL
            const response = await fetch(photoUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              archive.append(Buffer.from(arrayBuffer), { name: zipFilename });
            }
          } else {
            const relativePath = photoUrl.replace(/^\//, "");
            const filePath = path.join(process.cwd(), relativePath);
            if (fs.existsSync(filePath)) {
              archive.file(filePath, { name: zipFilename });
            }
          }
        };

        if (record.photos && record.photos.length > 0) {
          for (let i = 0; i < record.photos.length; i++) {
            const photo = record.photos[i];
            const ext = path.extname(photo.url) || ".jpg";
            const photoDate = new Date(photo.createdAt);
            const dateStr = `${photoDate.getFullYear()}${String(photoDate.getMonth() + 1).padStart(2, '0')}${String(photoDate.getDate()).padStart(2, '0')}`;
            const suffix = record.photos.length > 1 ? `_${i + 1}` : "";
            const zipFilename = `${safeTitle}/${safeName}_${dateStr}${suffix}${ext}`;
            await appendPhotoToArchive(photo.url, zipFilename);
          }
        } else if (record.photoUrl) {
          const ext = path.extname(record.photoUrl) || ".jpg";
          const startDate = new Date(session.startedAt);
          const dateStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
          const zipFilename = `${safeTitle}/${safeName}_${dateStr}${ext}`;
          await appendPhotoToArchive(record.photoUrl, zipFilename);
        }
      }

      await archive.finalize();
    } catch (err) {
      console.error("ZIP download error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create ZIP" });
      }
    }
  });

  // === Sessions ===
  app.get(api.sessions.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const locationType = req.query.locationType as string | undefined;
    const role = await getUserRole(req);

    let effectiveLocationType = locationType;
    if (role === "stock_counter_toko") effectiveLocationType = "toko";
    if (role === "stock_counter_gudang") effectiveLocationType = "gudang";

    const user = await authStorage.getUser(getUserId(req));
    const sessions = await storage.getSessions(adminId, effectiveLocationType, user?.branchId || undefined);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sessionsWithStatus = sessions.map(s => {
      const isOld = new Date(s.startedAt) < threeDaysAgo;
      // Real backup status: prioritizes database flag
      const isBackedUp = s.backupStatus === "moved" || s.backupStatus === "verified" || !!s.gDriveUrl;

      return {
        ...s,
        isBackedUp,
        isOld,
        backupStatus: s.backupStatus || (isOld ? "pending" : "none")
      };
    });

    res.json(sessionsWithStatus);
  });

  app.post(api.sessions.create.path, isAuthenticated, requireRole("admin", "stock_counter"), async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const user = await authStorage.getUser(getUserId(req));
      const session = await storage.createSession({
        ...input,
        userId: adminId,
        branchId: user?.branchId || null
      });

      await storage.createActivityLog({
        userId: user!.id,
        branchId: user?.branchId,
        action: "START_OPNAME",
        details: `Started opname session: ${input.title}`,
      });

      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Create session error:", err);
      res.status(500).json({ message: (err as Error).message || "Gagal membuat sesi" });
    }
  });

  app.get(api.sessions.get.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const session = await storage.getSession(Number(req.params.id));
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const isOld = new Date(session.startedAt) < threeDaysAgo;

    const isBackedUp = session.backupStatus === "moved" || session.backupStatus === "verified" || !!session.gDriveUrl;

    const sessionWithBackupStatus = {
      ...session,
      isBackedUp,
      isOld,
      backupStatus: session.backupStatus || (isOld ? "pending" : "none")
    };

    res.json(sessionWithBackupStatus);
  });

  app.patch("/api/user/gdrive-remote", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { remoteName } = z.object({ remoteName: z.string().min(1) }).parse(req.body);
      const userId = getUserId(req);
      await authStorage.updateUser(userId, { gDriveRemote: remoteName });
      res.json({ message: "Konfigurasi remote Google Drive berhasil disimpan" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Format nama remote tidak valid" });
      }
      res.status(500).json({ message: "Gagal menyimpan konfigurasi" });
    }
  });

  app.post(api.sessions.backup.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const sessionId = Number(req.params.id);
      console.log(`Manual backup triggered for session ${sessionId}`);

      // Update status to pending first
      await storage.updateSession(sessionId, { backupStatus: "pending" });

      // Run backup in background
      processBackup(sessionId, true).catch(err => {
        console.error(`Background backup failed for ${sessionId}:`, err);
      });

      res.json({ message: "Proses perpindahan ke Google Drive telah dimulai di latar belakang." });
    } catch (err) {
      res.status(500).json({ message: "Gagal memicu backup" });
    }
  });

  app.post(api.sessions.verifyBackup.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const sessionId = Number(req.params.id);
      const session = await storage.getSession(sessionId);
      if (!session) return res.status(404).json({ message: "Sesi tidak ditemukan" });

      const [adminUser] = await db.select().from(users).where(eq(users.id, session.userId));
      const remoteName = adminUser?.gDriveRemote || "gdrive";

      const folderName = `${session.id}_${session.title.replace(/[^a-z0-9]/gi, '_')}`;
      const remotePath = `${remoteName}:KazanaBackups/Sessions/${folderName}`;

      console.log(`Verifying backup on GDrive: ${remotePath}`);

      try {
        // Run rclone ls to check if folder exists and has files
        const output = execSync(`rclone ls "${remotePath}" --max-depth 1`).toString();
        if (output.trim().length > 0) {
          await storage.updateSession(sessionId, { backupStatus: "verified" });
          res.json({
            success: true,
            message: "Verifikasi Berhasil! File ditemukan di Google Drive.",
            details: output
          });
        } else {
          res.status(400).json({ success: false, message: "Folder ditemukan tapi kosong." });
        }
      } catch (err) {
        res.status(404).json({
          success: false,
          message: "Folder tidak ditemukan di Google Drive atau rclone gagal.",
          error: (err as Error).message
        });
      }
    } catch (err) {
      res.status(500).json({ message: "Gagal melakukan verifikasi" });
    }
  });

  app.post(api.sessions.complete.path, isAuthenticated, requireRole("admin", "stock_counter"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const session = await storage.getSession(Number(req.params.id));
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const completed = await storage.completeSession(Number(req.params.id));

    // Log activity
    const user = await authStorage.getUser(getUserId(req));
    await storage.createActivityLog({
      userId: user!.id,
      branchId: user?.branchId,
      action: "COMPLETE_OPNAME",
      details: `Completed opname session: ${session.title}`,
    }).catch(err => console.error("Failed to log session completion:", err));

    res.json(completed);
  });

  // === Records ===
  app.post(api.records.update.path, isAuthenticated, requireRole("admin", "stock_counter"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const sessionId = Number(req.params.sessionId);
    const session = await storage.getSession(sessionId);
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const { productId, actualStock, notes, unitValues, countedBy, returnedQuantity, returnedNotes } = req.body;

    if (typeof productId !== 'number' || typeof actualStock !== 'number') {
      return res.status(400).json({ message: "Invalid input" });
    }

    const record = await storage.updateRecord(sessionId, productId, actualStock, notes, unitValues, countedBy, returnedQuantity, returnedNotes);
    res.json(record);
  });

  app.post(api.upload.opnamePhoto.path, isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const productId = Number(req.params.productId);
      const adminId = await getTeamAdminId(req);

      const session = await storage.getSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Sesi tidak ditemukan" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File tidak terunggah" });
      }

      // Ensure record exists
      let [record] = await db.select().from(opnameRecords).where(
        and(eq(opnameRecords.sessionId, sessionId), eq(opnameRecords.productId, productId))
      );

      if (!record) {
        record = await storage.updateRecord(sessionId, productId, 0);
      }

      const url = await uploadToObjectStorage(req.file);
      const photo = await storage.addRecordPhoto({ recordId: record.id, url });

      res.status(201).json(photo);
    } catch (err) {
      console.error("Opname photo upload error:", err);
      res.status(500).json({ message: "Gagal mengunggah foto" });
    }
  });

  // === Staff Members ===
  app.get(api.staff.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const members = await storage.getStaffMembers(adminId);
    res.json(members);
  });

  app.post(api.staff.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { name, locationType } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      const member = await storage.createStaffMember({
        name,
        locationType: locationType || "toko",
        userId: adminId,
        active: 1,
      });
      res.status(201).json(member);
    } catch (err) {
      console.error("Create staff error:", err);
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put(api.staff.update.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name, locationType, active } = req.body;
      const member = await storage.updateStaffMember(id, { name, locationType, active });
      res.json(member);
    } catch (err) {
      console.error("Update staff error:", err);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete(api.staff.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      await storage.deleteStaffMember(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete staff error:", err);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // === Inbound (Barang Masuk) ===
  app.get(api.inbound.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const sessions = await storage.getInboundSessions(adminId);
    res.json(sessions);
  });

  app.post(api.inbound.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const input = api.inbound.create.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const session = await storage.createInboundSession({ ...input, userId: adminId });
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Create inbound error:", err);
      res.status(500).json({ message: "Gagal membuat sesi inbound" });
    }
  });

  app.get(api.inbound.get.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const session = await storage.getInboundSession(Number(req.params.id));
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: "Inbound session not found" });
    }
    res.json(session);
  });

  app.post(api.inbound.complete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const session = await storage.getInboundSession(Number(req.params.id));
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: "Session not found" });
    }
    const completed = await storage.completeInboundSession(Number(req.params.id));
    res.json(completed);
  });

  app.post(api.inbound.addItem.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const input = api.inbound.addItem.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const session = await storage.getInboundSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }
      const item = await storage.addInboundItem({ ...input, sessionId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal menambah item" });
    }
  });

  app.delete(api.inbound.removeItem.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const itemId = Number(req.params.itemId);
      const adminId = await getTeamAdminId(req);
      const session = await storage.getInboundSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }
      await storage.removeInboundItem(itemId);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus item" });
    }
  });

  app.post(api.inbound.saveSignatures.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.inbound.saveSignatures.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const session = await storage.getInboundSession(id);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }
      const updated = await storage.updateInboundSignatures(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal menyimpan tanda tangan" });
    }
  });

  // === Outbound (Barang Keluar) ===
  app.get(api.outbound.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const sessions = await storage.getOutboundSessions(adminId);
    res.json(sessions);
  });

  app.post(api.outbound.create.path, isAuthenticated, requireRole("admin", "sku_manager", "driver"), async (req, res) => {
    try {
      const input = api.outbound.create.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const session = await storage.createOutboundSession({ ...input, userId: adminId });
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Create outbound error:", err);
      res.status(500).json({ message: "Gagal membuat sesi outbound" });
    }
  });

  app.get(api.outbound.get.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const session = await storage.getOutboundSession(Number(req.params.id));
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: "Outbound session not found" });
    }
    res.json(session);
  });

  app.post(api.outbound.complete.path, isAuthenticated, requireRole("admin", "sku_manager", "driver"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const session = await storage.getOutboundSession(Number(req.params.id));
    if (!session || session.userId !== adminId) {
      return res.status(404).json({ message: "Session not found" });
    }
    const completed = await storage.completeOutboundSession(Number(req.params.id));
    res.json(completed);
  });

  app.post(api.outbound.addItem.path, isAuthenticated, requireRole("admin", "sku_manager", "driver"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const input = api.outbound.addItem.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const session = await storage.getOutboundSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }
      const item = await storage.addOutboundItem({ ...input, sessionId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal menambah item" });
    }
  });

  app.delete(api.outbound.removeItem.path, isAuthenticated, requireRole("admin", "sku_manager", "driver"), async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const itemId = Number(req.params.itemId);
      const adminId = await getTeamAdminId(req);
      const session = await storage.getOutboundSession(sessionId);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }
      await storage.removeOutboundItem(itemId);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus item" });
    }
  });

  app.post(api.outbound.uploadPhoto.path, isAuthenticated, upload.single("photo"), async (req, res) => {
    try {
      const { sessionId, itemId } = req.params;
      const adminId = await getTeamAdminId(req);

      const session = await storage.getOutboundSession(Number(sessionId));
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(req.file);
      const photo = await storage.addOutboundItemPhoto(Number(itemId), url);
      res.status(201).json(photo);
    } catch (err) {
      console.error("Outbound photo upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.post(api.outbound.saveSignatures.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.outbound.saveSignatures.input.parse(req.body);
      const adminId = await getTeamAdminId(req);
      const session = await storage.getOutboundSession(id);
      if (!session || session.userId !== adminId) {
        return res.status(404).json({ message: "Session not found" });
      }
      const updated = await storage.updateOutboundSignatures(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal menyimpan tanda tangan" });
    }
  });


  app.get(api.branches.list.path, isAuthenticated, async (req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar cabang" });
    }
  });


  // === Announcements ===
  app.get(api.announcements.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const items = await storage.getAnnouncements(adminId);
    res.json(items);
  });

  app.post(api.announcements.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { title, content, expiresAt } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      const announcement = await storage.createAnnouncement({
        title,
        content,
        imageUrl: null,
        userId: adminId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      res.status(201).json(announcement);
    } catch (err) {
      console.error("Create announcement error:", err);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.put(api.announcements.update.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { title, content, expiresAt, imageUrl } = req.body;
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      const announcement = await storage.updateAnnouncement(id, updates as any);
      res.json(announcement);
    } catch (err) {
      console.error("Update announcement error:", err);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.post(api.announcements.uploadImage.path, isAuthenticated, requireRole("admin"), upload.single("image"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = await uploadToObjectStorage(file);
      const announcement = await storage.updateAnnouncement(id, { imageUrl: url });
      res.json(announcement);
    } catch (err) {
      console.error("Announcement image upload error:", err);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.delete(api.announcements.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteAnnouncement(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete announcement error:", err);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // === Production (BOM & Assembly) ===
  app.get(api.production.boms.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const items = await storage.getBOMs(adminId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar BOM" });
    }
  });

  app.post(api.production.boms.create.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const input = api.production.boms.create.input.parse(req.body);
      const bom = await storage.createBOM({ ...input, userId: adminId });
      res.status(201).json(bom);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal membuat BOM" });
    }
  });

  app.get(api.production.boms.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getBOM(id);
      if (!item) return res.status(404).json({ message: "BOM tidak ditemukan" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil detail BOM" });
    }
  });

  app.post(api.production.boms.addItem.path, isAuthenticated, async (req, res) => {
    try {
      const bomId = Number(req.params.bomId);
      const input = api.production.boms.addItem.input.parse(req.body);
      const item = await storage.addBOMItem({ ...input, bomId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal menambah item BOM" });
    }
  });

  app.delete(api.production.boms.removeItem.path, isAuthenticated, async (req, res) => {
    try {
      await storage.removeBOMItem(Number(req.params.itemId));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus item BOM" });
    }
  });

  app.get(api.production.sessions.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const items = await storage.getAssemblySessions(adminId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar sesi produksi" });
    }
  });

  app.post(api.production.sessions.create.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const input = api.production.sessions.create.input.parse(req.body);
      const session = await storage.createAssemblySession({ ...input, userId: adminId });
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal membuat sesi produksi" });
    }
  });

  app.get(api.production.sessions.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getAssemblySession(id);
      if (!item) return res.status(404).json({ message: "Sesi tidak ditemukan" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil detail sesi produksi" });
    }
  });

  app.post(api.production.sessions.complete.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const session = await storage.completeAssemblySession(id);
      res.json(session);
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Gagal memfinalisasi produksi" });
    }
  });



  // === Phase 19 & 20: Analytics & AI ===
  app.get(api.analytics.stockHealth.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const health = await storage.getStockHealth(adminId);
      res.json(health);
    } catch (err) {
      console.error("Stock health error:", err);
      res.status(500).json({ message: "Gagal memproses kesehatan stok" });
    }
  });

  app.get(api.analytics.categoryPerformance.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const data = await storage.getCategoryPerformance(adminId);
      res.json(data);
    } catch (err) {
      console.error("Category performance error:", err);
      res.status(500).json({ message: "Gagal memproses performa kategori" });
    }
  });

  app.get(api.analytics.aiInsights.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      
      // Fetch some context for the AI
      const health = await storage.getStockHealth(adminId);
      const categories = await storage.getCategoryPerformance(adminId);
      const demand = await storage.getInventoryDemand(adminId);

      const insights = await generateBusinessInsights({
        stockHealth: health,
        categoryPerformance: categories,
        turnoverRate: demand.slice(0, 10) // Only top 10 for tokens
      });

      res.json(insights);
    } catch (err) {
      console.error("AI Insights error:", err);
      res.status(500).json({ message: "Gagal menghasilkan wawasan AI" });
    }
  });

  app.post(api.production.predict.path, isAuthenticated, requireRole("admin", "production"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const demand = await storage.getInventoryDemand(adminId);
      const filteredDemand = demand.filter(d => d.daysLeft < 14);

      const prompt = `
        Analisis data stok berikut dan berikan rekomendasi rencana produksi harian yang optimal.
        Data Stok Kritis (Kurang dari 14 hari):
        ${JSON.stringify(filteredDemand, null, 2)}
        
        Berikan jawaban dalam format Markdown yang rapi dalam Bahasa Indonesia.
      `;

      const advice = await generateProductionAdvice(prompt);
      res.json({ advice });
    } catch (err) {
      console.error("Production AI error:", err);
      res.status(500).json({ message: "Gagal menghasilkan prediksi produksi" });
    }
  });

  // === POS & CRM ===
  app.post(api.pos.updatePin.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { pin } = req.body;
      if (!pin || pin.length !== 6) {
        return res.status(400).json({ message: "PIN harus 6 digit" });
      }
      await storage.updateUserPin(userId, pin);
      res.json({ message: "PIN berhasil diperbarui" });
    } catch (err) {
      console.error("Update PIN error:", err);
      res.status(500).json({ message: "Gagal memperbarui PIN" });
    }
  });

  // === POS Devices Routes ===
  app.get(api.pos.devices.list.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const devices = await storage.getPosDevices(adminId);
    res.json(devices);
  });

  app.post(api.pos.devices.register.path, async (req, res) => {
    try {
      const input = api.pos.devices.register.input.parse(req.body);

      // Validate Registration Code
      const codeRecord = await storage.getPosRegistrationCode(input.registrationCode);
      if (!codeRecord) {
        return res.status(400).json({ message: "Kode registrasi tidak valid atau sudah kadaluwarsa" });
      }

      const adminId = codeRecord.userId;

      // Check if device already exists
      const existing = await storage.getPosDevice(input.deviceId);
      if (existing) {
        // Just update it if it's the same admin's device
        if (existing.userId === adminId) {
          await storage.deleteRegistrationCode(input.registrationCode);
          return res.json(existing);
        }
        return res.status(400).json({ message: "Perangkat ini sudah terdaftar di tim lain" });
      }

      const device = await storage.createPosDevice({
        deviceId: input.deviceId,
        name: input.name,
        userId: adminId
      });

      // Delete the code after use
      await storage.deleteRegistrationCode(input.registrationCode);

      res.status(201).json(device);
    } catch (err) {
      console.error("Register Device Error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Gagal mendaftarkan perangkat" });
    }
  });

  app.get(api.pos.devices.registrationCodes.list.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    const adminId = await getTeamAdminId(req);
    await storage.deleteExpiredRegistrationCodes(adminId);
    const codes = await db.select().from(posRegistrationCodes).where(eq(posRegistrationCodes.userId, adminId));
    res.json(codes);
  });

  app.post(api.pos.devices.registrationCodes.generate.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      await storage.deleteExpiredRegistrationCodes(adminId);

      // Generate 6-digit numeric code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const result = await storage.createPosRegistrationCode({
        code,
        userId: adminId,
        expiresAt
      });

      res.status(201).json(result);
    } catch (err) {
      console.error("Generate Code Error:", err);
      res.status(500).json({ message: "Gagal membuat kode registrasi" });
    }
  });

  app.post("/api/user/pin", isAuthenticated, async (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin || pin.length !== 6) {
        return res.status(400).json({ message: "PIN harus 6 digit" });
      }
      const userId = getUserId(req);
      await authStorage.updateUserPin(userId, pin);
      res.json({ message: "PIN berhasil diperbarui" });
    } catch (err) {
      res.status(500).json({ message: "Gagal memperbarui PIN" });
    }
  });

  app.post("/api/admin/user/pin", isAuthenticated, async (req, res) => {
    try {
      // Hanya Admin yang bisa set PIN user lain
      if (await getUserRole(req) !== 'admin') {
        return res.status(403).json({ message: "Hanya Admin yang dapat mengatur PIN Kasir" });
      }

      const { userId, pin } = req.body;
      if (!userId || !pin || pin.length !== 6) {
        return res.status(400).json({ message: "Data tidak lengkap atau PIN tidak valid" });
      }

      // Verifikasi bahwa user yang akan diubah PIN-nya adalah anggota tim Admin ini
      const targetUser = await authStorage.getUser(userId);
      const teamId = getUserId(req);

      if (!targetUser || (targetUser.adminId !== teamId && targetUser.id !== teamId)) {
        return res.status(403).json({ message: "Anda tidak memiliki akses ke user ini" });
      }

      await authStorage.updateUserPin(userId, pin);
      res.json({ message: `PIN untuk ${targetUser.username || targetUser.firstName || 'user'} berhasil diperbarui` });
    } catch (err) {
      console.error("Admin Update PIN Error:", err);
      res.status(500).json({ message: "Gagal memperbarui PIN staff" });
    }
  });

  app.get("/api/pos/devices/cashiers", async (req, res) => {
    try {
      const deviceId = req.query.deviceId as string;
      if (!deviceId) return res.status(400).json({ message: "Device ID wajib disertakan" });

      const device = await storage.getPosDevice(deviceId);
      if (!device || !device.active) {
        return res.status(401).json({ message: "Perangkat tidak terdaftar", registered: false });
      }

      const teamId = device.userId;
      // Ambil user yang role-nya admin atau cashier dalam tim ini
      const teamUsers = await db.select().from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .where(
          and(
            or(
              eq(users.id, teamId),
              eq(users.adminId, teamId)
            ),
            or(
              eq(userRoles.role, "admin"),
              eq(userRoles.role, "cashier")
            )
          )
        );

      const formattedUsers = teamUsers.map(({ users: u, user_roles: r }) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        role: r?.role || 'cashier',
        profileImageUrl: u.profileImageUrl
      }));

      // Jika terminal ditugaskan ke user tertentu
      if (device.assignedUserId) {
        const assigned = formattedUsers.filter(u => u.id === device.assignedUserId || u.role === 'admin');
        return res.json(assigned);
      }

      res.json(formattedUsers);
    } catch (err) {
      console.error("Get Cashiers Error:", err);
      res.status(500).json({ message: "Gagal mengambil daftar kasir" });
    }
  });

  app.post(api.pos.devices.verify.path, async (req, res) => {
    try {
      const { deviceId, pin, userId } = req.body;
      const device = await storage.getPosDevice(deviceId);

      if (!device || !device.active) {
        return res.status(401).json({
          message: "Perangkat tidak terdaftar atau tidak aktif",
          registered: false
        });
      }

      // 1. Find the user
      const teamId = device.userId;
      const [user] = await db.select().from(users).where(
        and(
          userId ? eq(users.id, userId) : eq(users.posPin, pin), // Support legacy pin-only for a while if needed, but primarily use userId
          eq(users.posPin, pin),
          or(
            eq(users.id, teamId),
            eq(users.adminId, teamId)
          )
        )
      );

      if (!user) {
        return res.status(401).json({
          message: "PIN tidak cocok atau user tidak ditemukan",
          deviceName: device.name,
          registered: true
        });
      }

      // 2. Check terminal assignment if set
      if (device.assignedUserId && device.assignedUserId !== user.id) {
        // Izinkan admin masuk ke terminal mana saja meskipun ditugaskan ke kasir tertentu
        const role = await storage.getUserRole(user.id);
        if (role?.role !== 'admin') {
          return res.status(401).json({
            message: "Anda tidak ditugaskan di terminal ini",
            deviceName: device.name,
            registered: true
          });
        }
      }

      const { password: _, ...safeUser } = user;

      // Inject session for the authenticated user (cashier/admin)
      (req.session as any).userId = user.id;

      res.json({
        message: "PIN valid",
        deviceName: device.name,
        user: safeUser,
        registered: true
      });
    } catch (err) {
      console.error("Verify PIN Error:", err);
      res.status(500).json({ message: "Gagal memverifikasi PIN" });
    }
  });

  app.patch("/api/pos/devices/:deviceId/assign", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const deviceId = req.params.deviceId as string;
      const { userId } = req.body; // userId can be null to unassign

      const device = await storage.getPosDevice(deviceId);
      if (!device) return res.status(404).json({ message: "Terminal tidak ditemukan" });

      const adminId = await getTeamAdminId(req);
      if (device.userId !== adminId) return res.status(403).json({ message: "Bukan terminal milik tim Anda" });

      await storage.assignPosDeviceUser(deviceId, userId);
      res.json({ message: "Penugasan kasir berhasil diperbarui" });
    } catch (err) {
      console.error("Assign Terminal Error:", err);
      res.status(500).json({ message: "Gagal memperbarui penugasan terminal" });
    }
  });

  app.delete(api.pos.devices.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const adminId = await getTeamAdminId(req);
      const devices = await storage.getPosDevices(adminId);
      const exists = devices.find(d => d.id === id);

      if (!exists) {
        return res.status(404).json({ message: "Perangkat tidak ditemukan" });
      }

      await storage.deletePosDevice(id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus perangkat" });
    }
  });

  app.get(api.pos.sales.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const sales = await storage.getSales(adminId, branchId);
      res.json(sales);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar penjualan" });
    }
  });

  app.post(api.pos.sales.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { sale, items } = req.body;

      // UUID for future sync
      const saleWithUuid = {
        ...sale,
        userId,
        uuid: crypto.randomUUID(),
        createdAt: new Date()
      };

      const newSale = await storage.createSale(saleWithUuid, items);
      res.status(201).json(newSale);
    } catch (err) {
      console.error("Sale Error:", err);
      res.status(500).json({ message: "Gagal memproses penjualan" });
    }
  });

  app.get(api.pos.sales.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const sale = await storage.getSale(id);
      if (!sale) return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      res.json(sale);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil detail penjualan" });
    }
  });

  // === ERP Invoices ===
  app.get(api.erp.invoices.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar invoice" });
    }
  });

  app.post(api.erp.invoices.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { items, ...saleData } = req.body;
      const sale = await storage.createSale({
        ...saleData,
        userId,
        type: "erp_invoice",
        uuid: crypto.randomUUID(),
        createdAt: new Date()
      }, items);
      res.status(201).json(sale);
    } catch (err) {
      console.error("Invoice Error:", err);
      res.status(500).json({ message: "Gagal membuat invoice" });
    }
  });

  app.patch(api.erp.invoices.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      const { status } = req.body;
      await storage.updateInvoiceStatus(id, userId, status);
      res.json({ message: "Status invoice diperbarui" });
    } catch (err) {
      res.status(500).json({ message: "Gagal memperbarui status invoice" });
    }
  });

  // === Stock Transfers (Logistics) ===
  app.get(api.transfers.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const transfers = await storage.getStockTransfers(adminId);
      res.json(transfers);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar mutasi stok" });
    }
  });

  app.get(api.transfers.get.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const transfer = await storage.getStockTransfer(id);
      if (!transfer) return res.status(404).json({ message: "Mutasi tidak ditemukan" });
      res.json(transfer);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil detail mutasi" });
    }
  });

  app.post(api.transfers.create.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { items, ...transferData } = req.body;

      const transfer = await storage.createStockTransfer(adminId, {
        ...transferData,
        userId: adminId,
        createdAt: new Date()
      }, items);

      res.status(201).json(transfer);
    } catch (err) {
      console.error("Transfer Error:", err);
      res.status(500).json({ message: "Gagal membuat mutasi stok" });
    }
  });

  app.post(api.transfers.receive.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { receivedBy } = req.body;
      const transfer = await storage.completeStockTransfer(id, receivedBy || "Staff");
      res.json(transfer);
    } catch (err) {
      console.error("Receive Transfer Error:", err);
      res.status(500).json({ message: "Gagal menerima mutasi stok" });
    }
  });


  // === POS Promotions ===
  app.get(api.pos.promotions.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const promos = await storage.getActivePromotions(adminId);
      res.json(promos);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar promo" });
    }
  });

  app.post(api.pos.promotions.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const input = api.pos.promotions.create.input.parse(req.body);
      const promo = await storage.createPromotion({ ...input, userId: adminId });
      res.status(201).json(promo);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal membuat promo" });
    }
  });

  app.delete(api.pos.promotions.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deletePromotion(id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus promo" });
    }
  });

  // === POS SESSIONS ===
  app.get(api.pos.sessions.active.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const session = await storage.getActivePOSSession(userId);
      res.json(session || null);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil sesi aktif" });
    }
  });

  app.get(api.pos.sessions.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const sessions = await storage.getPOSSessions(adminId, branchId);
      res.json(sessions);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil riwayat sesi" });
    }
  });

  app.post(api.pos.sessions.start.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { openingBalance, notes } = req.body;
      const session = await storage.createPOSSession({
        userId,
        openingBalance: Number(openingBalance),
        notes,
        status: "open",
        startTime: new Date(),
      });
      res.json(session);
    } catch (err) {
      res.status(500).json({ message: "Gagal membuka sesi" });
    }
  });

  app.post(api.pos.sessions.close.path, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { closingBalance, actualCash, notes } = req.body;
      const session = await storage.closePOSSession(id, {
        closingBalance: Number(closingBalance),
        actualCash: Number(actualCash),
        notes
      });
      res.json(session);
    } catch (err) {
      res.status(500).json({ message: "Gagal menutup sesi" });
    }
  });

  // === PETTY CASH ===
  app.get(api.pos.sessions.pettyCash.list.path, isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id as string);
      const items = await storage.getPettyCash(sessionId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil data kas kecil" });
    }
  });

  app.post(api.pos.pettyCash.create.path, isAuthenticated, async (req, res) => {
    try {
      const { sessionId, amount, description, type } = req.body;
      const item = await storage.createPettyCash({
        sessionId,
        amount: Number(amount),
        description,
        type
      });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Gagal mencatat kas kecil" });
    }
  });

  // === PENDING SALES ===
  app.get(api.pos.sessions.pendingSales.list.path, isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id as string);
      const items = await storage.getPendingSales(sessionId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar pending sale" });
    }
  });

  app.post(api.pos.pendingSales.save.path, isAuthenticated, async (req, res) => {
    try {
      const { sessionId, cartData, customerName } = req.body;
      const item = await storage.savePendingSale({
        sessionId,
        cartData,
        customerName
      });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Gagal menyimpan pending sale" });
    }
  });

  app.delete(api.pos.pendingSales.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deletePendingSale(parseInt(req.params.id as string));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus pending sale" });
    }
  });

  // === VOUCHERS ===
  app.get(api.pos.vouchers.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const list = await storage.getVouchers(userId);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar voucher" });
    }
  });

  app.get(api.pos.vouchers.validate.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const code = req.query.code as string;
      const voucher = await storage.getVoucherByCode(userId, code);
      if (!voucher) return res.status(404).json({ message: "Voucher tidak ditemukan atau tidak aktif" });

      if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
        return res.status(400).json({ message: "Voucher sudah kadaluwarsa" });
      }

      res.json(voucher);
    } catch (err) {
      res.status(500).json({ message: "Gagal memvalidasi voucher" });
    }
  });

  app.post(api.pos.vouchers.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const userId = getUserId(req);
      const voucher = await storage.createVoucher({
        ...req.body,
        userId,
        active: 1,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      });
      res.json(voucher);
    } catch (err) {
      res.status(500).json({ message: "Gagal membuat voucher" });
    }
  });

  app.delete(api.pos.vouchers.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteVoucher(parseInt(req.params.id as string));
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus voucher" });
    }
  });

  // === Store Settings ===
  app.get(api.settings.get.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const s = await storage.getSettings(adminId);
      res.json(s || { storeName: "Kazana Shop" });
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil pengaturan toko" });
    }
  });

  app.put(api.settings.update.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const s = await storage.updateSettings(adminId, req.body);
      res.json(s);
    } catch (err) {
      res.status(500).json({ message: "Gagal memperbarui pengaturan toko" });
    }
  });

  // === Reports & Export ===
  app.get(api.erp.reports.export.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { type } = req.query;

      let filename = "report.csv";
      let csvContent = "";

      if (type === "sales") {
        const salesData = await storage.getSales(userId);
        filename = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;

        csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "ID,Date,Invoice,Customer,Total,Status,Type\n";
        salesData.forEach(s => {
          const dateStr = s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date(s.createdAt).toISOString();
          csvContent += `${s.id},${dateStr},${s.invoiceNumber || "-"},${s.customerId || "Umum"},${s.totalAmount},${s.paymentStatus},${s.type}\n`;
        });
      } else if (type === "journal") {
        const journal = await storage.getJournalEntries(userId);
        filename = `journal_report_${new Date().toISOString().slice(0, 10)}.csv`;

        csvContent = "\uFEFF"; // BOM for UTF-8
        csvContent += "ID,Date,Description,Reference,Account,Debit,Credit\n";
        journal.forEach(entry => {
          const entryDate = entry.date instanceof Date ? entry.date.toISOString() : new Date(entry.date).toISOString();
          entry.items.forEach(item => {
            csvContent += `${entry.id},${entryDate},${entry.description},${entry.reference || "-"},${item.accountId},${item.debit},${item.credit}\n`;
          });
        });
      } else if (type === "profit_loss") {
        const adminId = await getTeamAdminId(req);
        const userAccounts = await storage.getAccounts(adminId);
        const entries = await storage.getJournalEntries(adminId);

        const incomeAccs = userAccounts.filter(a => a.type === 'income');
        const expenseAccs = userAccounts.filter(a => a.type === 'expense');

        filename = `profit_loss_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent = "\uFEFF";
        csvContent += "Account Code,Account Name,Type,Balance\n";

        let totalIncome = 0;
        let totalExpense = 0;

        [...incomeAccs, ...expenseAccs].forEach(acc => {
          let balance = 0;
          entries.forEach(e => {
            e.items.forEach(i => {
              if (i.accountId === acc.id) {
                if (acc.type === 'income') balance += (i.credit - i.debit);
                else balance += (i.debit - i.credit);
              }
            });
          });
          if (acc.type === 'income') totalIncome += balance;
          else totalExpense += balance;
          csvContent += `${acc.code},${acc.name},${acc.type},${balance}\n`;
        });
        csvContent += `\nTOTAL INCOME,,,${totalIncome}\n`;
        csvContent += `TOTAL EXPENSE,,,${totalExpense}\n`;
        csvContent += `NET PROFIT,,,${totalIncome - totalExpense}\n`;

      } else if (type === "balance_sheet") {
        const adminId = await getTeamAdminId(req);
        const accounts = await storage.getAccounts(adminId);
        const entries = await storage.getJournalEntries(adminId);

        filename = `balance_sheet_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent = "\uFEFF";
        csvContent += "Account Code,Account Name,Type,Balance\n";

        const balances: Record<number, number> = {};
        accounts.forEach(a => balances[a.id] = 0);

        entries.forEach(e => {
          e.items.forEach(i => {
            const acc = accounts.find(a => a.id === i.accountId);
            if (acc) {
              if (acc.type === 'asset' || acc.type === 'expense') {
                balances[i.accountId] += (i.debit - i.credit);
              } else {
                balances[i.accountId] += (i.credit - i.debit);
              }
            }
          });
        });

        accounts.forEach(acc => {
          csvContent += `${acc.code},${acc.name},${acc.type},${balances[acc.id] || 0}\n`;
        });
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.status(200).send(csvContent);
    } catch (err) {
      console.error("Export Error:", err);
      res.status(500).json({ message: "Gagal mengekspor laporan" });
    }
  });

  app.get(api.pos.customers.list.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const customers = await storage.getCustomers(userId, branchId);
      res.json(customers);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar pelanggan" });
    }
  });

  app.post(api.pos.customers.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const customerData = api.pos.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer({ ...customerData, userId });
      res.status(201).json(customer);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Gagal menyimpan data pelanggan" });
    }
  });


  // === Feedback (Kritik & Saran) ===
  app.get(api.feedback.list.path, isAuthenticated, async (req, res) => {
    const role = await getUserRole(req);
    if (role === "admin") {
      const adminId = await getTeamAdminId(req);
      const allFeedback = await storage.getFeedback(adminId);
      res.json(allFeedback);
    } else {
      const userId = getUserId(req);
      const userFeedback = await storage.getFeedback(userId);
      res.json(userFeedback);
    }
  });

  app.post(api.feedback.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const adminId = await getTeamAdminId(req);
      const { type, content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const user = await authStorage.getUser(userId);
      const fb = await storage.createFeedback({
        userId: adminId,
        userName: user?.username || user?.firstName || "Unknown",
        type: type || "saran",
        content,
      });
      res.status(201).json(fb);
    } catch (err) {
      console.error("Create feedback error:", err);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.delete(api.feedback.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteFeedback(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete feedback error:", err);
      res.status(500).json({ message: "Failed to delete feedback" });
    }
  });

  // === Motivation Messages ===
  app.get(api.motivation.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const messages = await storage.getMotivationMessages(adminId);
    res.json(messages);
  });

  app.post(api.motivation.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      const msg = await storage.createMotivationMessage({
        message,
        userId: adminId,
        active: 1,
      });
      res.status(201).json(msg);
    } catch (err) {
      console.error("Create motivation error:", err);
      res.status(500).json({ message: "Failed to create motivation message" });
    }
  });

  app.put(api.motivation.update.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { message, active } = req.body;
      const msg = await storage.updateMotivationMessage(id, { message, active });
      res.json(msg);
    } catch (err) {
      console.error("Update motivation error:", err);
      res.status(500).json({ message: "Failed to update motivation message" });
    }
  });

  app.delete(api.motivation.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteMotivationMessage(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete motivation error:", err);
      res.status(500).json({ message: "Failed to delete motivation message" });
    }
  });

  // === Category Priorities ===
  app.get(api.categoryPriorities.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    let priorities = await storage.getCategoryPriorities(userId);
    if (priorities.length === 0) {
      const adminId = await getTeamAdminId(req);
      if (adminId !== userId) {
        priorities = await storage.getCategoryPriorities(adminId);
      }
    }
    res.json(priorities);
  });

  app.post(api.categoryPriorities.set.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { priorities } = req.body as { priorities: { categoryName: string; sortOrder: number }[] };
      const result = await storage.setCategoryPriorities(userId, priorities || []);
      res.json(result);
    } catch (err) {
      console.error("Set category priorities error:", err);
      res.status(500).json({ message: "Failed to set category priorities" });
    }
  });

  // === Phase 19: Analytics ===
  app.get(api.analytics.stockHealth.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const health = await storage.getStockHealth(adminId);
      res.json(health);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil data kesehatan stok" });
    }
  });

  app.get(api.analytics.aiInsights.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const health = await storage.getStockHealth(adminId);
      const topSelling = await storage.getTopSellingItems(adminId);

      const prompt = `Gunakan data inventaris berikut untuk memberikan 3-4 wawasan atau saran strategis bisnis yang sangat spesifik dan membantu dalam bahasa Indonesia.
      
Data Inventaris:
- Total Produk: ${health.totalItems}
- Produk Sehat (Stok Cukup): ${health.healthy}
- Produk Stok Rendah: ${health.lowStock}
- Produk Habis Stok: ${health.outOfStock}

Produk Terlaris Baru-baru Ini:
${topSelling.map(p => `- ${p.name}: Terjual ${p.totalQuantity} unit, Pendapatan Rp${p.totalRevenue.toLocaleString()}`).join('\n')}

Format output harus berupa JSON array of objects dengan struktur:
[
  { "title": "Judul Wawasan", "content": "Penjelasan detail dan saran aksi konkret.", "type": "info" | "warning" | "success" }
]
Pastikan output hanya berisi JSON array tersebut agar bisa di-parse secara otomatis.`;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json([
          { title: "AI Diperlukan Konfigurasi", content: "Kunci API Google Gemini belum diatur di server. Hubungi dukungan teknis.", type: "warning" }
        ]);
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanJson = text.replace(/```json|```/g, "").trim();
      const insights = JSON.parse(cleanJson);

      res.json(insights);
    } catch (err) {
      console.error("AI Insights Error:", err);
      res.json([
        { title: "Sedang Menganalisis", content: "Wawasan AI mendalam akan tersedia segera setelah sinkronisasi data selesai.", type: "info" }
      ]);
    }
  });

  app.get(api.analytics.categoryPerformance.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const performance = await storage.getCategoryPerformance(adminId);
      res.json(performance);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil performa kategori" });
    }
  });

  // === Excel Template & Import ===
  app.get(api.excel.template.path, isAuthenticated, requireRole("admin", "sku_manager"), (req, res) => {
    const wb = XLSX.utils.book_new();
    const headers = ["SKU", "Nama Produk", "Kategori", "Deskripsi", "Stok Awal", "Lokasi", "Satuan"];
    const exampleRows = [
      ["ITEM-001", "Contoh Produk", "Elektronik", "Deskripsi produk", 10, "toko", "pcs"],
      ["ITEM-002", "Produk Kedua", "Makanan", "", 25, "gudang", "dus, pack, pcs"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
    ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Template Produk");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=template_produk.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  });

  app.post(api.excel.import.path, isAuthenticated, requireRole("admin", "sku_manager"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);
      const wb = XLSX.read(fileBuffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rows.length < 2) {
        return res.status(400).json({ message: "File kosong atau tidak memiliki data" });
      }

      const adminId = await getTeamAdminId(req);
      const existingProducts = await storage.getProducts(adminId);
      const existingSkus = new Set(existingProducts.map(p => p.sku.toLowerCase()));
      const existingProductCodes = new Set(existingProducts.filter(p => p.productCode).map(p => p.productCode!.toLowerCase()));

      const headerRow = rows[0] || [];
      const firstHeader = String(headerRow[0] || "").trim().toLowerCase();
      const isGudangFormat = firstHeader === "product name" || firstHeader === "nama produk" || firstHeader === "product code" ||
        (headerRow.length >= 2 && String(headerRow[1] || "").trim().toLowerCase() === "product code");

      let imported = 0;
      let skipped = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === "")) {
          continue;
        }

        if (isGudangFormat) {
          const name = String(row[0] || "").trim();
          const productCode = String(row[1] || "").trim();
          const satuanRaw = String(row[2] || "").trim();
          const category = String(row[3] || "").trim() || null;
          const subCategory = String(row[4] || "").trim() || null;

          if (!name) {
            errors.push({ row: i + 1, message: "Nama Produk wajib diisi" });
            skipped++;
            continue;
          }

          const sku = productCode || `GDG-${Date.now()}-${i}`;

          if (existingSkus.has(sku.toLowerCase())) {
            errors.push({ row: i + 1, message: `Produk "${name}" (kode: ${sku}) sudah ada` });
            skipped++;
            continue;
          }

          if (productCode && existingProductCodes.has(productCode.toLowerCase())) {
            errors.push({ row: i + 1, message: `Kode Produk "${productCode}" sudah ada` });
            skipped++;
            continue;
          }

          try {
            const product = await storage.createProduct({
              sku,
              name,
              category,
              description: null,
              currentStock: 0,
              photoUrl: null,
              userId: adminId,
              locationType: "gudang",
              subCategory,
              productCode: productCode || null,
            });
            existingSkus.add(sku.toLowerCase());
            if (productCode) existingProductCodes.add(productCode.toLowerCase());

            if (satuanRaw) {
              const unitNames = satuanRaw.split(",").map(s => s.trim()).filter(Boolean);
              for (let j = 0; j < unitNames.length; j++) {
                await storage.addProductUnit({
                  productId: product.id,
                  unitName: unitNames[j],
                  conversionToBase: 1,
                  baseUnit: unitNames[j],
                  sortOrder: j,
                });
              }
            }

            imported++;
          } catch (err) {
            errors.push({ row: i + 1, message: "Gagal menyimpan produk" });
            skipped++;
          }
        } else {
          const sku = String(row[0] || "").trim();
          const name = String(row[1] || "").trim();
          const category = String(row[2] || "").trim() || null;
          const description = String(row[3] || "").trim() || null;
          const currentStock = parseInt(String(row[4] || "0"), 10);
          const locationRaw = String(row[5] || "").trim().toLowerCase();
          const locationType = locationRaw === "gudang" ? "gudang" : "toko";
          const satuanRaw = String(row[6] || "").trim();

          if (!sku) {
            errors.push({ row: i + 1, message: "SKU wajib diisi" });
            skipped++;
            continue;
          }

          if (!name) {
            errors.push({ row: i + 1, message: "Nama Produk wajib diisi" });
            skipped++;
            continue;
          }

          if (existingSkus.has(sku.toLowerCase())) {
            errors.push({ row: i + 1, message: `SKU "${sku}" sudah ada` });
            skipped++;
            continue;
          }

          if (isNaN(currentStock) || currentStock < 0) {
            errors.push({ row: i + 1, message: "Stok harus berupa angka positif" });
            skipped++;
            continue;
          }

          const subCategoryRaw = String(row[7] || "").trim() || null;
          const productCodeRaw = String(row[8] || "").trim() || null;

          try {
            const product = await storage.createProduct({
              sku,
              name,
              category,
              description,
              currentStock,
              photoUrl: null,
              userId: adminId,
              locationType,
              subCategory: subCategoryRaw,
              productCode: productCodeRaw,
            });
            existingSkus.add(sku.toLowerCase());

            if (satuanRaw) {
              const unitNames = satuanRaw.split(",").map(s => s.trim()).filter(Boolean);
              for (let j = 0; j < unitNames.length; j++) {
                await storage.addProductUnit({
                  productId: product.id,
                  unitName: unitNames[j],
                  conversionToBase: 1,
                  baseUnit: unitNames[j],
                  sortOrder: j,
                });
              }
            }

            imported++;
          } catch (err) {
            errors.push({ row: i + 1, message: "Gagal menyimpan produk" });
            skipped++;
          }
        }
      }

      res.json({ imported, skipped, errors, format: isGudangFormat ? "gudang" : "standard" });
    } catch (err) {
      console.error("Excel import error:", err);
      res.status(500).json({ message: "Gagal memproses file Excel" });
    }
  });

  app.post(api.excel.gudangTemplate.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Data Produk Gudang");

      // 1. Baris Instruksi
      const instructionRow = sheet.addRow([
        "PETUNJUK: Isi data produk di bawah ini. Satuan 1 adalah satuan terbesar (misal: Dus), Satuan 3 adalah terkecil (Pcs). Kolom bertanda (*) wajib diisi. Satuan 1 & 2 opsional."
      ]);
      sheet.mergeCells('A1:L1');
      instructionRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F7FF' }
      };
      instructionRow.getCell(1).font = { bold: true, color: { argb: 'FF1E40AF' }, size: 10 };
      instructionRow.height = 30;
      instructionRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // 2. Header
      const headers = [
        "Kode Produk*", "Nama Produk*", "Kategori", "Sub Kategori",
        "Nama Satuan 1 (Besar)", "Nama Satuan 2 (Tengah)", "Nama Satuan 3 (Kecil)*",
        "Konversi 1 ke 2", "Konversi 2 ke 3",
        "Stok (Satuan 1)", "Stok (Satuan 2)", "Stok (Satuan 3)"
      ];
      const headerRow = sheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 25;

      // 3. Contoh Data
      const exampleRow = ["GDG-001", "Contoh Produk", "Makanan", "Snack", "Dus", "Pack", "Gram", 24, 500, 0, 0, 0];
      const row3 = sheet.addRow(exampleRow);
      row3.font = { italic: true, color: { argb: 'FF6B7280' } };

      // 4. Pengaturan Kolom
      sheet.columns = [
        { width: 18 }, { width: 30 }, { width: 15 }, { width: 15 },
        { width: 22 }, { width: 22 }, { width: 22 },
        { width: 20 }, { width: 20 },
        { width: 15 }, { width: 15 }, { width: 15 }
      ];

      // 5. Freeze Panes (Freeze first 2 rows and first 2 columns)
      sheet.views = [
        { state: 'frozen', xSplit: 2, ySplit: 2 }
      ];

      const buf = await workbook.xlsx.writeBuffer();
      res.setHeader("Content-Disposition", "attachment; filename=template_gudang.xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err) {
      console.error("Gudang template error:", err);
      res.status(500).json({ message: "Gagal membuat template gudang" });
    }
  });

  app.post(api.excel.gudangExport.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const productsWithUnits = await storage.getProductsWithPhotosAndUnits(adminId);
      const gudangProducts = productsWithUnits.filter(p => p.locationType === "gudang");

      const wb = XLSX.utils.book_new();

      const headers = [
        "Kode Produk", "Nama Produk", "Kategori", "Sub Kategori",
        "Nama Satuan 1 (Terbesar)", "Nama Satuan 2 (Tengah)", "Nama Satuan 3 (Terkecil)",
        "Konversi Satuan 1 ke Satuan 2", "Konversi Satuan 2 ke Satuan 3",
        "Stok (Satuan 1)", "Stok (Satuan 2)", "Stok (Satuan 3)"
      ];
      const rows = gudangProducts.map(p => {
        const units = p.units || [];
        const sortedUnits = [...units].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        let unit1Name = "";
        let unit2Name = "";
        let unit3Name = "";
        let conv1to2 = 0;
        let conv2to3 = 0;

        if (sortedUnits.length >= 3) {
          unit1Name = sortedUnits[0].unitName;
          unit2Name = sortedUnits[1].unitName;
          unit3Name = sortedUnits[2].unitName;
          // conv1to2 = berapa unit2 dalam 1 unit1
          conv1to2 = sortedUnits[0].conversionToBase / sortedUnits[1].conversionToBase;
          // conv2to3 = berapa unit3 dalam 1 unit2
          conv2to3 = sortedUnits[1].conversionToBase / sortedUnits[2].conversionToBase;
        } else if (sortedUnits.length === 2) {
          unit1Name = sortedUnits[0].unitName;
          unit2Name = sortedUnits[1].unitName;
          conv1to2 = sortedUnits[0].conversionToBase / sortedUnits[1].conversionToBase;
        } else if (sortedUnits.length === 1) {
          unit1Name = sortedUnits[0].unitName;
        }

        return [
          p.productCode || p.sku,
          p.name,
          p.category || "",
          p.subCategory || "",
          unit1Name,
          unit2Name,
          unit3Name,
          conv1to2 || "",
          conv2to3 || "",
          0,
          0,
          0,
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 22 }, { wch: 22 }, { wch: 22 },
        { wch: 26 }, { wch: 26 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Data Produk Gudang");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", "attachment; filename=export_gudang.xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err) {
      console.error("Gudang export error:", err);
      res.status(500).json({ message: "Gagal export gudang" });
    }
  });

  app.post(api.excel.gudangImport.path, isAuthenticated, requireRole("admin", "sku_manager"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);
      const wb = XLSX.read(fileBuffer, { type: "buffer" });

      const wsData = wb.Sheets["Data Produk Gudang"] || wb.Sheets[wb.SheetNames[0]];
      if (!wsData) {
        return res.status(400).json({ message: "Sheet 'Data Produk Gudang' tidak ditemukan" });
      }

      const dataRows: any[][] = XLSX.utils.sheet_to_json(wsData, { header: 1 });
      if (dataRows.length < 2) {
        return res.status(400).json({ message: "File kosong atau tidak memiliki data" });
      }

      const adminId = await getTeamAdminId(req);
      const existingProducts = await storage.getProducts(adminId);
      const existingSkus = new Set(existingProducts.map(p => p.sku.toLowerCase()));
      const existingProductCodes = new Set(existingProducts.filter(p => p.productCode).map(p => p.productCode!.toLowerCase()));

      let imported = 0;
      let skipped = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0 || row.every((cell: any) => cell === undefined || cell === null || cell === "")) {
          continue;
        }

        const productCode = String(row[0] || "").trim();
        const name = String(row[1] || "").trim();
        const category = String(row[2] || "").trim() || null;
        const subCategory = String(row[3] || "").trim() || null;
        const unit1Name = String(row[4] || "").trim();
        const unit2Name = String(row[5] || "").trim();
        const unit3Name = String(row[6] || "").trim();
        const conv1to2 = parseFloat(String(row[7] || "0")) || 0;
        const conv2to3 = parseFloat(String(row[8] || "0")) || 0;
        const stok1 = parseFloat(String(row[9] || "0")) || 0;
        const stok2 = parseFloat(String(row[10] || "0")) || 0;
        const stok3 = parseFloat(String(row[11] || "0")) || 0;

        if (!name) {
          errors.push({ row: i + 1, message: "Nama Produk wajib diisi" });
          skipped++;
          continue;
        }

        const sku = productCode || `GDG-${Date.now()}-${i}`;

        if (existingSkus.has(sku.toLowerCase())) {
          errors.push({ row: i + 1, message: `Produk "${name}" (kode: ${sku}) sudah ada` });
          skipped++;
          continue;
        }

        if (productCode && existingProductCodes.has(productCode.toLowerCase())) {
          errors.push({ row: i + 1, message: `Kode Produk "${productCode}" sudah ada` });
          skipped++;
          continue;
        }

        try {
          // Logic Satuan Beranak (Hierarchical)
          const unitsToCreate: { unitName: string; conversionToBase: number; baseUnit: string; sortOrder: number }[] = [];
          let baseUnitName = "";
          let totalBase = 0;

          // Tentukan level terkecil yang ada
          if (unit3Name) {
            baseUnitName = unit3Name;
          } else if (unit2Name) {
            baseUnitName = unit2Name;
          } else if (unit1Name) {
            baseUnitName = unit1Name;
          }

          if (!baseUnitName) {
            errors.push({ row: i + 1, message: "Minimal harus ada satu Satuan" });
            skipped++;
            continue;
          }

          // Hitung Conversion To Base dan Total Stock
          let level3Conv = 1;
          let level2Conv = conv2to3 > 0 ? conv2to3 : 1;
          let level1Conv = (conv1to2 > 0 ? conv1to2 : 1) * level2Conv;

          if (unit3Name) {
            unitsToCreate.push({ unitName: unit3Name, conversionToBase: 1, baseUnit: baseUnitName, sortOrder: 2 });
            totalBase += stok3;
          }
          if (unit2Name) {
            const ratio = unit3Name ? conv2to3 : 1;
            const convToBase = unit3Name ? ratio : 1;
            unitsToCreate.push({ unitName: unit2Name, conversionToBase: convToBase, baseUnit: baseUnitName, sortOrder: 1 });
            totalBase += stok2 * convToBase;
          }
          if (unit1Name) {
            let convToBase = 1;
            if (unit2Name && unit3Name) {
              convToBase = conv1to2 * conv2to3;
            } else if (unit2Name) {
              convToBase = conv1to2;
            } else if (unit3Name) {
              convToBase = conv1to2; // conv1to2 treated as conv1to3 if Level 2 skipped
            }
            unitsToCreate.push({ unitName: unit1Name, conversionToBase: convToBase, baseUnit: baseUnitName, sortOrder: 0 });
            totalBase += stok1 * convToBase;
          }

          const product = await storage.createProduct({
            sku,
            name,
            category,
            description: null,
            currentStock: totalBase,
            photoUrl: null,
            userId: adminId,
            locationType: "gudang",
            subCategory,
            productCode: productCode || null,
          });
          existingSkus.add(sku.toLowerCase());
          if (productCode) existingProductCodes.add(productCode.toLowerCase());

          // Sort by sortOrder before saving to maintain clean hierarchy
          unitsToCreate.sort((a, b) => a.sortOrder - b.sortOrder);
          for (let j = 0; j < unitsToCreate.length; j++) {
            await storage.addProductUnit({
              productId: product.id,
              unitName: unitsToCreate[j].unitName,
              conversionToBase: unitsToCreate[j].conversionToBase,
              baseUnit: unitsToCreate[j].baseUnit,
              sortOrder: j,
            });
          }

          imported++;
        } catch (err) {
          console.error("Gudang import unit error:", err);
          errors.push({ row: i + 1, message: "Gagal menyimpan produk atau satuan" });
          skipped++;
        }
      }

      res.json({ imported, skipped, errors, format: "gudang-3-tingkat" });
    } catch (err) {
      console.error("Gudang import error:", err);
      res.status(500).json({ message: "Gagal memproses file Excel gudang" });
    }
  });

  app.get(api.excel.export.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const productsWithUnits = await storage.getProductsWithPhotosAndUnits(adminId);

      const wb = XLSX.utils.book_new();
      const headers = ["SKU", "Nama Produk", "Kategori", "Deskripsi", "Stok", "Lokasi", "Satuan", "Sub Kategori", "Kode Produk"];
      const rows = productsWithUnits.map(p => [
        p.sku,
        p.name,
        p.category || "",
        p.description || "",
        p.currentStock,
        p.locationType || "toko",
        p.units && p.units.length > 0
          ? p.units.sort((a, b) => a.sortOrder - b.sortOrder).map(u => u.unitName).join(", ")
          : "",
        p.subCategory || "",
        p.productCode || "",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, "Produk");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", "attachment; filename=produk_export.xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err) {
      console.error("Excel export error:", err);
      res.status(500).json({ message: "Gagal export Excel" });
    }
  });

  // === Accounting API ===
  app.get(api.accounting.accounts.list.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const accounts = await storage.getAccounts(adminId);
      const entries = await storage.getJournalEntries(adminId);

      const balances: Record<number, number> = {};
      accounts.forEach(a => balances[a.id] = 0);

      entries.forEach(e => {
        e.items.forEach(i => {
          const acc = accounts.find(a => a.id === i.accountId);
          if (acc) {
            // Asset/Expense: Debit + , Credit -
            // Liability/Equity/Income: Debit - , Credit +
            if (acc.type === 'asset' || acc.type === 'expense') {
              balances[i.accountId] += (Number(i.debit) - Number(i.credit));
            } else {
              balances[i.accountId] += (Number(i.credit) - Number(i.debit));
            }
          }
        });
      });

      res.json(accounts.map(a => ({ ...a, balance: balances[a.id] || 0 })));
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar akun dan saldo" });
    }
  });

  app.post(api.accounting.accounts.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const account = await storage.createAccount({ ...req.body, userId: adminId });
      res.json(account);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat akun" });
    }
  });

  app.get(api.accounting.journal.list.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const entries = await storage.getJournalEntries(adminId, branchId);
      res.json(entries);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar jurnal" });
    }
  });

  app.post(api.accounting.journal.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { description, reference, items } = req.body;
      const entry = await storage.createJournalEntry(
        { description, reference, userId: adminId, date: new Date() },
        items.map((item: any) => ({ ...item, userId: adminId }))
      );
      res.json(entry);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat entri jurnal" });
    }
  });

  app.get(api.accounting.assets.list.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const assets = await storage.getFixedAssets(adminId);
      res.json(assets);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar aset" });
    }
  });

  app.post(api.accounting.assets.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const asset = await storage.createFixedAsset({ ...req.body, userId: adminId });
      res.json(asset);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat aset" });
    }
  });

  // Simple Financial Reports
  app.get(api.accounting.reports.balanceSheet.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const accounts = await storage.getAccounts(adminId);
      const entries = await storage.getJournalEntries(adminId, branchId);

      const balances: Record<number, number> = {};
      accounts.forEach(a => balances[a.id] = 0);

      entries.forEach(e => {
        e.items.forEach(i => {
          const acc = accounts.find(a => a.id === i.accountId);
          if (acc) {
            // Asset/Expense: Debit + , Credit -
            // Liability/Equity/Income: Debit - , Credit +
            if (acc.type === 'asset' || acc.type === 'expense') {
              balances[i.accountId] += (i.debit - i.credit);
            } else {
              balances[i.accountId] += (i.credit - i.debit);
            }
          }
        });
      });

      res.json(accounts.map(a => ({ ...a, balance: balances[a.id] || 0 })));
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat laporan Neraca" });
    }
  });

  app.get(api.accounting.reports.profitAndLoss.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
      const userAccounts = await storage.getAccounts(adminId);
      const entries = await storage.getJournalEntries(adminId, branchId);

      const incomeAccs = userAccounts.filter(a => a.type === 'income');
      const expenseAccs = userAccounts.filter(a => a.type === 'expense');

      let totalIncome = 0;
      let totalExpense = 0;

      const details: any[] = [];

      [...incomeAccs, ...expenseAccs].forEach(acc => {
        let balance = 0;
        entries.forEach(e => {
          e.items.forEach(i => {
            if (i.accountId === acc.id) {
              if (acc.type === 'income') balance += (i.credit - i.debit);
              else balance += (i.debit - i.credit);
            }
          });
        });

        if (acc.type === 'income') totalIncome += balance;
        else totalExpense += balance;

        details.push({ ...acc, balance });
      });

      res.json({ totalIncome, totalExpense, netProfit: totalIncome - totalExpense, details });
    } catch (e) {
      console.error("P&L error:", e);
      res.status(500).json({ message: "Gagal membuat laporan Laba Rugi" });
    }
  });

  // === Phase 21: Finance Module - Cash Ledger ===
  app.get("/api/accounting/cash-ledger", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      if (!accountId) {
        return res.status(400).json({ message: "Account ID diperlukan" });
      }

      // Get account details
      const accounts = await storage.getAccounts(adminId);
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return res.status(404).json({ message: "Akun tidak ditemukan" });
      }

      // Get journal entries for this account
      const entries = await storage.getJournalEntries(adminId);

      // Filter entries by date range
      const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        if (from && entryDate < from) return false;
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          if (entryDate > toDate) return false;
        }
        return true;
      });

      // Get journal items for this account
      const allItems = [];
      for (const entry of filteredEntries) {
        const accountItems = entry.items.filter(item => item.accountId === accountId);

        for (const item of accountItems) {
          allItems.push({
            id: item.id,
            date: entry.createdAt,
            description: entry.description || "Transaksi",
            reference: entry.reference || `JRN-${entry.id}`,
            debit: Number(item.debit),
            credit: Number(item.credit),
            entryId: entry.id
          });
        }
      }

      // Sort by date
      allItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      const result = allItems.map(item => {
        if (account.type === 'asset' || account.type === 'expense') {
          runningBalance += (item.debit - item.credit);
        } else {
          runningBalance += (item.credit - item.debit);
        }
        return {
          ...item,
          balance: runningBalance
        };
      });

      res.json(result);
    } catch (e) {
      console.error("Cash ledger error:", e);
      res.status(500).json({ message: "Gagal mengambil data kas & bank" });
    }
  });

  // === Phase 21: Finance Module - Petty Cash Report ===
  app.get("/api/admin/petty-cash-report", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      // Get POS sessions
      const sessions = await storage.getPOSSessions(adminId);

      // Get petty cash entries
      const pettyCashEntries = await db.select().from(posPettyCash)
        .where(eq(posPettyCash.sessionId, sessionId!))
        .orderBy(desc(posPettyCash.createdAt));

      // If no sessionId specified, get all petty cash entries
      let allEntries = [];
      if (sessionId) {
        allEntries = pettyCashEntries;
      } else {
        // Get all petty cash entries for this user
        const allSessions = sessions.filter((s: any) => s.userId === adminId);
        for (const session of allSessions) {
          const entries = await db.select().from(posPettyCash)
            .where(eq(posPettyCash.sessionId, session.id))
            .orderBy(desc(posPettyCash.createdAt));
          allEntries.push(...entries);
        }
      }

      // Filter by date range
      let filteredEntries = allEntries;
      if (from || to) {
        filteredEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.createdAt);
          if (from && entryDate < from) return false;
          if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            if (entryDate > toDate) return false;
          }
          return true;
        });
      }

      // Format response with session title
      const result = filteredEntries.map((entry: any) => {
        const session = sessions.find((s: any) => s.id === entry.sessionId);
        return {
          id: entry.id,
          createdAt: entry.createdAt,
          sessionId: entry.sessionId,
          sessionTitle: session?.title || `Sesi ${entry.sessionId}`,
          description: entry.description,
          type: entry.type,
          amount: Number(entry.amount)
        };
      });

      // Sort by date (newest first)
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(result);
    } catch (e) {
      console.error("Petty cash report error:", e);
      res.status(500).json({ message: "Gagal mengambil data kas kecil" });
    }
  });

  // === Phase 23: Report Hub - Stock Ledger ===
  app.get("/api/reports/stock-ledger", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const productId = req.query.productId ? Number(req.query.productId) : undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      if (!productId) {
        return res.status(400).json({ message: "Product ID diperlukan" });
      }

      // Get activities for this product
      // We'll combine data from sales, inbound sessions, outbound sessions, and opname
      const history: any[] = [];

      // 1. Sales
      const salesData = await db.select({
        id: sales.id,
        date: sales.createdAt,
        reference: sales.invoiceNumber,
        qty: saleItems.quantity,
        type: sql`'OUT (SALE)'`
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(eq(saleItems.productId, productId), eq(sales.userId, adminId)));

      for (const sale of salesData) {
        history.push({
          date: sale.date,
          reference: sale.reference || `SALE-${sale.id}`,
          qtyChange: -Number(sale.qty),
          type: "Penjualan",
          balance: 0 // Will calculate later
        });
      }

      // 2. Inbound
      const inboundData = await db.select({
        id: inboundSessions.id,
        date: inboundSessions.createdAt,
        qty: inboundItems.quantity,
      })
      .from(inboundItems)
      .innerJoin(inboundSessions, eq(inboundItems.sessionId, inboundSessions.id))
      .where(and(eq(inboundItems.productId, productId), eq(inboundSessions.userId, adminId)));

      for (const item of inboundData) {
        history.push({
          date: item.date,
          reference: `INB-${item.id}`,
          qtyChange: Number(item.qty),
          type: "Barang Masuk",
          balance: 0
        });
      }

      // 3. Outbound (Transfers)
      const outboundData = await db.select({
        id: outboundSessions.id,
        date: outboundSessions.createdAt,
        qty: outboundItems.quantity,
      })
      .from(outboundItems)
      .innerJoin(outboundSessions, eq(outboundItems.sessionId, outboundSessions.id))
      .where(and(eq(outboundItems.productId, productId), eq(outboundSessions.userId, adminId)));

      for (const item of outboundData) {
        history.push({
          date: item.date,
          reference: `OUT-${item.id}`,
          qtyChange: -Number(item.qty),
          type: "Barang Keluar",
          balance: 0
        });
      }

      // Sort by date ascending
      history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter by date range after combined
      let filteredHistory = history;
      if (from || to) {
        filteredHistory = history.filter(h => {
          const d = new Date(h.date);
          if (from && d < from) return false;
          if (to) {
            const tEnd = new Date(to);
            tEnd.setHours(23, 59, 59, 999);
            if (d > tEnd) return false;
          }
          return true;
        });
      }

      // Calculate running balance
      let currentBalance = 0;
      const result = filteredHistory.map(h => {
        currentBalance += h.qtyChange;
        return { ...h, balance: currentBalance };
      });

      // Return newest first for UI display
      res.json(result.reverse());
    } catch (e) {
      console.error("Stock ledger error:", e);
      res.status(500).json({ message: "Gagal mengambil kartu stok" });
    }
  });

  // === Phase 23: Report Hub - Sales Summary ===
  app.get("/api/reports/sales-summary", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      const salesList = await storage.getSales(adminId);
      
      const filteredSales = salesList.filter(s => {
        const d = new Date(s.createdAt);
        if (from && d < from) return false;
        if (to) {
          const tEnd = new Date(to);
          tEnd.setHours(23, 59, 59, 999);
          if (d > tEnd) return false;
        }
        return true;
      });

      let totalRevenue = 0;
      let totalCogs = 0;
      let totalDiscount = 0;
      let transactionCount = filteredSales.length;

      for (const sale of filteredSales) {
        totalRevenue += Number(sale.totalAmount);
        totalDiscount += Number(sale.discountAmount || 0);

        const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
        for (const item of items) {
          totalCogs += Number(item.cogs || 0);
        }
      }

      res.json({
        revenue: totalRevenue,
        cogs: totalCogs,
        grossProfit: totalRevenue - totalCogs,
        discount: totalDiscount,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? totalRevenue / transactionCount : 0
      });
    } catch (e) {
      console.error("Sales summary error:", e);
      res.status(500).json({ message: "Gagal mengambil ringkasan penjualan" });
    }
  });

  // === Phase 23: Report Hub - Sales per Item ===
  app.get("/api/reports/sales-items", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      // Grouped by Product
      const productStats = new Map<number, { name: string; sku: string; qty: number; revenue: number; cogs: number }>();

      const salesList = await storage.getSales(adminId);
      for (const sale of salesList) {
        const d = new Date(sale.createdAt);
        if (from && d < from) continue;
        if (to) {
          const tEnd = new Date(to);
          tEnd.setHours(23, 59, 59, 999);
          if (d > tEnd) continue;
        }

        const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
        const productsList = await storage.getProducts(adminId);

        for (const item of items) {
          const product = productsList.find((p: any) => p.id === item.productId);
          if (!product) continue;

          const current = productStats.get(item.productId) || { name: product.name, sku: product.sku, qty: 0, revenue: 0, cogs: 0 };
          current.qty += Number(item.quantity);
          current.revenue += Number(item.subtotal);
          current.cogs += Number(item.cogs || 0);
          productStats.set(item.productId, current);
        }
      }

      const result = Array.from(productStats.entries()).map(([id, stats]) => ({
        productId: id,
        ...stats,
        profit: stats.revenue - stats.cogs
      }));

      // Sort by dynamic field
      const sortBy = (req.query.sortBy as string) || "revenue";
      result.sort((a: any, b: any) => b[sortBy] - a[sortBy]);

      res.json(result);
    } catch (e) {
      console.error("Sales per item error:", e);
      res.status(500).json({ message: "Gagal mengambil data penjualan per produk" });
    }
  });

  // === CRM API ===
  app.get(api.crm.customers.listWithStats.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const customers = await storage.getCustomersWithStats(adminId);
      res.json(customers);
    } catch (e) {
      console.error("CRM customers error:", e);
      res.status(500).json({ message: "Gagal mengambil data pelanggan" });
    }
  });

  app.get(api.crm.customers.loyaltyHistory.path, isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) return res.status(400).json({ message: "ID pelanggan tidak valid" });
      const history = await storage.getCustomerLoyaltyHistory(customerId);
      res.json(history);
    } catch (e) {
      console.error("Loyalty history error:", e);
      res.status(500).json({ message: "Gagal mengambil riwayat poin pelanggan" });
    }
  });

  app.post(api.production.predict.path, isAuthenticated, requireRole("admin", "production"), async (req, res) => {
    try {
      const { generateProductionAdvice } = await import("./ai");
      const adminId = await getTeamAdminId(req);

      // Ambil data produk dan performa penjualan 30 hari terakhir
      const allProducts = await storage.getProducts(adminId);
      const { saleItems: saleItemsTable, sales: salesTable } = await import("@shared/schema");
      const { eq, gte, and, sql } = await import("drizzle-orm");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const enrichedProducts = [];
      for (const p of allProducts.slice(0, 50)) { // Limit to top 50 to avoid prompt token limit
        const salesData = await db.select({ totalSold: sql<number>`sum(quantity)` })
          .from(saleItemsTable)
          .innerJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
          .where(and(
            eq(saleItemsTable.productId, p.id),
            gte(salesTable.createdAt, thirtyDaysAgo)
          ));

        const totalSold = Number(salesData[0]?.totalSold || 0);
        const dailyRate = totalSold / 30;

        enrichedProducts.push({
          name: p.name,
          sku: p.sku,
          category: p.category || "Uncategorized",
          stock: p.currentStock,
          soldLast30Days: totalSold,
          dailyVelocity: Math.round(dailyRate * 100) / 100,
          daysRemaining: dailyRate > 0 ? Math.floor(p.currentStock / dailyRate) : (p.currentStock > 0 ? 999 : 0)
        });
      }

      const productContext = enrichedProducts
        .map(p => `- ${p.name} (${p.category}): Sisa ${p.stock} unit. Terjual ${p.soldLast30Days} unit dlm 30 hari. Laju: ${p.dailyVelocity}/hari. Estimasi Habis: ${p.daysRemaining} hari.`)
        .join("\n");

      const prompt = `Anda adalah AI Konsultan Bisnis & Produksi Pabrik yang sangat cerdas untuk Kazana ERP.
Berikut adalah data inventaris dan performa penjualan 30 hari terakhir:
${productContext}

Tugas Anda:
1. Analisa produk mana yang paling mendesak untuk diproduksi/restock (Produk 'Star' atau 'Critical').
2. Berikan rekomendasi jumlah produksi batch harian yang spesifik untuk persiapan esok hari.
3. Berikan saran strategi harga: Jika ada produk yang stoknya melimpah namun penjualannya sangat lambat (Low Velocity), sarankan besaran diskon (%) atau promo khusus untuk memutar modal.
4. Berikan output dalam format Markdown yang sangat elegan, profesional, dan poin-poin. Gunakan emoji yang relevan.
5. Akhiri dengan "Ringkasan Eksekutif" singkat tentang kesehatan stok toko secara keseluruhan.`;

      const advice = await generateProductionAdvice(prompt);
      res.json({ advice });
    } catch (e: any) {
      console.error("AI Prediction Error:", e);
      res.status(500).json({ message: e.message || "Gagal mendapatkan prediksi AI" });
    }
  });

  // === Pricing ===
  app.get(api.pricing.tiered.list.path, isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    const pricing = await storage.getTieredPricing(productId);
    res.json(pricing);
  });

  app.post(api.pricing.tiered.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const input = api.pricing.tiered.create.input.parse(req.body);
      const pricing = await storage.createTieredPricing({ ...input, userId: adminId });
      res.status(201).json(pricing);
    } catch (err) {
      res.status(400).json({ message: "Gagal menyimpan harga bertingkat" });
    }
  });

  app.delete(api.pricing.tiered.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    await storage.deleteTieredPricing(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Bundling ===
  app.get(api.bundling.list.path, isAuthenticated, async (req, res) => {
    const parentProductId = Number(req.params.parentProductId);
    const bundles = await storage.getProductBundles(parentProductId);
    res.json(bundles);
  });

  app.post(api.bundling.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const input = api.bundling.create.input.parse(req.body);
      const bundle = await storage.createProductBundle(input);
      res.status(201).json(bundle);
    } catch (err) {
      res.status(400).json({ message: "Gagal menyimpan paket bundling" });
    }
  });

  app.delete(api.bundling.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    await storage.deleteProductBundle(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Categories ===
  app.get(api.categories.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const categories = await storage.getCategories(adminId);
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory({ ...input, userId: adminId });
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: "Gagal membuat kategori" });
    }
  });

  app.put(api.categories.update.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const input = api.categories.update.input.parse(req.body);
      const category = await storage.updateCategory(Number(req.params.id), input);
      res.json(category);
    } catch (err) {
      res.status(400).json({ message: "Gagal memperbarui kategori" });
    }
  });

  app.delete(api.categories.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.sendStatus(204);
  });

  // === Units ===
  app.get(api.units.list.path, isAuthenticated, async (req, res) => {
    const adminId = await getTeamAdminId(req);
    const units = await storage.getUnits(adminId);
    res.json(units);
  });

  app.post(api.units.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const input = api.units.create.input.parse(req.body);
      const unit = await storage.createUnit({ ...input, userId: adminId });
      res.status(201).json(unit);
    } catch (err) {
      res.status(400).json({ message: "Gagal membuat satuan" });
    }
  });

  app.put(api.units.update.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const input = api.units.update.input.parse(req.body);
      const unit = await storage.updateUnit(Number(req.params.id), input);
      res.json(unit);
    } catch (err) {
      res.status(400).json({ message: "Gagal memperbarui satuan" });
    }
  });

  app.delete(api.units.delete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    await storage.deleteUnit(Number(req.params.id));
    res.sendStatus(204);
  });

  // === SaaS Module Payments (Midtrans) ===
  app.get("/api/payments/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const subs = await db
        .select()
        .from(moduleSubscriptions)
        .where(and(eq(moduleSubscriptions.userId, userId), eq(moduleSubscriptions.status, "settlement")))
        .orderBy(desc(moduleSubscriptions.paidAt));
      res.json(subs);
    } catch (e) {
      console.error("Get subscriptions error:", e);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/payments/checkout", isAuthenticated, async (req, res) => {
    try {
      const { moduleName, amount } = req.body;
      const userId = (req.session as any).userId;

      if (!moduleName || !amount) {
        return res.status(400).json({ message: "Module name and amount are required" });
      }

      const orderId = `MOD-${Date.now()}-${userId.substring(0, 5)}`;

      // Record pending transaction
      await db.insert(moduleSubscriptions).values({
        userId,
        moduleName,
        orderId,
        amount,
        status: "pending",
      });

      const user = await authStorage.getUser(userId);

      // Call Midtrans
      const token = await createTransactionToken(
        orderId,
        amount,
        { first_name: user?.firstName || "User", email: user?.email },
        [{ id: moduleName, price: amount, quantity: 1, name: `Kazana Module: ${moduleName}` }]
      );

      res.json({ token, orderId });
    } catch (e) {
      console.error("Checkout error:", e);
      res.status(500).json({ message: "Failed to create checkout token" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const statusResponse = await verifyWebhookSignature(req.body);
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;

      // Find subscription record
      const [subscription] = await db.select().from(moduleSubscriptions).where(eq(moduleSubscriptions.orderId, orderId));

      if (!subscription) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (transactionStatus === "capture" || transactionStatus === "settlement") {
        await db.update(moduleSubscriptions)
          .set({ status: "settlement", paidAt: new Date() })
          .where(eq(moduleSubscriptions.orderId, orderId));

        // Unlock the module for the user
        const user = await authStorage.getUser(subscription.userId);
        if (user) {
          const currentModules = (user.subscribedModules as string[]) || [];
          if (!currentModules.includes(subscription.moduleName)) {
            await authStorage.updateUser(user.id, {
              subscribedModules: [...currentModules, subscription.moduleName],
            });
          }
        }
      } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
        await db.update(moduleSubscriptions)
          .set({ status: transactionStatus })
          .where(eq(moduleSubscriptions.orderId, orderId));
      }

      console.info(`[Midtrans Webhook] Transaction ${orderId} updated to: ${transactionStatus}`);
      res.sendStatus(200);
    } catch (e) {
      console.error("[Midtrans Webhook] Critical Error:", e);
      res.status(500).json({ message: "Webhook Processing Error" });
    }
  });

  // === Phase 8: Advanced Inventory Valuation ===
  app.get(api.inventory.valuation.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const allProducts = await storage.getProducts(adminId);
      const { inventoryLots } = await import("@shared/schema");
      const { eq, and, gt, asc, sql } = await import("drizzle-orm");

      const valuationData = [];

      for (const product of allProducts) {
        const lots = await db.select().from(inventoryLots)
          .where(and(eq(inventoryLots.productId, product.id), gt(inventoryLots.remainingQuantity, 0)))
          .orderBy(asc(inventoryLots.inboundDate));

        let totalValue = 0;
        let totalQty = 0;
        for (const lot of lots) {
          totalValue += Number(lot.purchasePrice) * lot.remainingQuantity;
          totalQty += lot.remainingQuantity;
        }

        const avgCost = totalQty > 0 ? totalValue / totalQty : Number(product.unitCost || 0);

        valuationData.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          currentStock: product.currentStock,
          fifoValue: Math.round(totalValue * 100) / 100,
          avgCost: Math.round(avgCost * 100) / 100,
          unitCost: Number(product.unitCost || 0),
          lotsCount: lots.length,
        });
      }

      const grandTotal = valuationData.reduce((s, v) => s + v.fifoValue, 0);
      res.json({
        items: valuationData,
        summary: {
          totalProducts: valuationData.length,
          totalInventoryValue: Math.round(grandTotal * 100) / 100,
          productsWithLots: valuationData.filter(v => v.lotsCount > 0).length,
        }
      });
    } catch (e) {
      console.error("Inventory valuation error:", e);
      res.status(500).json({ message: "Gagal menghitung valuasi stok" });
    }
  });

  app.get(api.inventory.lots.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const { inventoryLots } = await import("@shared/schema");
      const { eq, asc } = await import("drizzle-orm");

      const lots = await db.select().from(inventoryLots)
        .where(eq(inventoryLots.productId, productId))
        .orderBy(asc(inventoryLots.inboundDate));

      const product = await storage.getProduct(productId);

      res.json({
        product: product ? { id: product.id, sku: product.sku, name: product.name } : null,
        lots: lots.map(lot => ({
          id: lot.id,
          purchasePrice: Number(lot.purchasePrice),
          initialQuantity: lot.initialQuantity,
          remainingQuantity: lot.remainingQuantity,
          consumed: lot.initialQuantity - lot.remainingQuantity,
          inboundDate: lot.inboundDate,
          inboundSessionId: lot.inboundSessionId,
          status: lot.remainingQuantity > 0 ? "active" : "depleted",
        })),
      });
    } catch (e) {
      console.error("Inventory lots error:", e);
      res.status(500).json({ message: "Gagal mengambil data lot" });
    }
  });

  app.get(api.inventory.stockLedger.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });

      const adminId = await getTeamAdminId(req);

      // Get inbound history
      const { inboundItems, inboundSessions, saleItems: saleItemsTable, sales: salesTable } = await import("@shared/schema");
      const { eq, and, desc: descOrd } = await import("drizzle-orm");

      const inbounds = await db.select({
        quantity: inboundItems.quantityReceived,
        date: inboundSessions.completedAt,
        sessionId: inboundSessions.id,
        supplier: inboundSessions.senderName,
      }).from(inboundItems)
        .innerJoin(inboundSessions, eq(inboundItems.sessionId, inboundSessions.id))
        .where(and(eq(inboundItems.productId, productId), eq(inboundSessions.status, "completed")));

      // Get sales history
      const salesData = await db.select({
        quantity: saleItemsTable.quantity,
        unitPrice: saleItemsTable.unitPrice,
        cogs: saleItemsTable.cogs,
        date: salesTable.createdAt,
        saleId: salesTable.id,
        type: salesTable.type,
        status: salesTable.paymentStatus,
      }).from(saleItemsTable)
        .innerJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
        .where(eq(saleItemsTable.productId, productId));

      // Build unified ledger
      const ledger: any[] = [];

      for (const ib of inbounds) {
        ledger.push({
          type: "IN",
          date: ib.date || new Date(),
          quantity: ib.quantity,
          reference: `Inbound #${ib.sessionId}`,
          detail: ib.supplier || "Supplier",
          unitCost: Number(product.unitCost || 0),
        });
      }

      for (const sl of salesData) {
        ledger.push({
          type: sl.status === "voided" ? "VOID" : "OUT",
          date: sl.date,
          quantity: Number(sl.quantity),
          reference: `Sale #${sl.saleId}`,
          detail: sl.type === "pos" ? "POS" : "Invoice",
          unitCost: Number(sl.quantity) > 0 ? Number(sl.cogs || 0) / Number(sl.quantity) : 0,
          totalCogs: Number(sl.cogs || 0),
        });
      }

      // Sort by date
      ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningQty = 0;
      for (const entry of ledger) {
        if (entry.type === "IN") {
          runningQty += entry.quantity;
        } else if (entry.type === "OUT") {
          runningQty -= entry.quantity;
        }
        entry.runningBalance = runningQty;
      }

      res.json({
        product: { id: product.id, sku: product.sku, name: product.name, currentStock: product.currentStock },
        ledger,
      });
    } catch (e) {
      console.error("Stock ledger error:", e);
      res.status(500).json({ message: "Gagal mengambil data kartu stok" });
    }
  });

  app.get(api.logistics.suggestions.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const suggestions = await storage.getLogisticsAlerts(adminId);
      res.json(suggestions);
    } catch (e) {
      console.error("Logistics suggestions error:", e);
      res.status(500).json({ message: "Gagal mengambil saran logistik" });
    }
  });

  app.get(api.inventory.consolidatedStock.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const productId = Number(req.params.productId);
      const results = await storage.getConsolidatedStock(productId, adminId);
      res.json(results);
    } catch (e) {
      console.error("Consolidated stock error:", e);
      res.status(500).json({ message: "Gagal mengambil data stok cabang" });
    }
  });

  // === Phase 9: Multi-Warehouse & Transfers ===

  // Branches CRUD
  app.post(api.branches.create.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { branches: branchesTable } = await import("@shared/schema");
      const [branch] = await db.insert(branchesTable).values({ ...req.body, userId: adminId }).returning();
      res.status(201).json(branch);
    } catch (e) {
      console.error("Branch create error:", e);
      res.status(500).json({ message: "Gagal membuat cabang" });
    }
  });

  app.put(api.branches.update.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { branches: branchesTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [branch] = await db.update(branchesTable).set(req.body).where(eq(branchesTable.id, Number(req.params.id))).returning();
      res.json(branch);
    } catch (e) {
      res.status(500).json({ message: "Gagal memperbarui cabang" });
    }
  });

  app.delete(api.branches.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { branches: branchesTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(branchesTable).where(eq(branchesTable.id, Number(req.params.id)));
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Gagal menghapus cabang" });
    }
  });

  // Stock Transfers
  app.get(api.transfers.list.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { stockTransfers, stockTransferItems, branches: branchesTable } = await import("@shared/schema");
      const { eq, desc: descOrd } = await import("drizzle-orm");

      const transfers = await db.select().from(stockTransfers)
        .where(eq(stockTransfers.userId, adminId))
        .orderBy(descOrd(stockTransfers.createdAt));

      const result = [];
      for (const t of transfers) {
        const items = await db.select().from(stockTransferItems)
          .where(eq(stockTransferItems.transferId, t.id));

        const enrichedItems = [];
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          enrichedItems.push({ ...item, product: product || null });
        }

        const fromBranch = t.fromBranchId
          ? (await db.select().from(branchesTable).where(eq(branchesTable.id, t.fromBranchId)))[0] || null
          : null;
        const toBranch = t.toBranchId
          ? (await db.select().from(branchesTable).where(eq(branchesTable.id, t.toBranchId)))[0] || null
          : null;

        result.push({ ...t, items: enrichedItems, fromBranch, toBranch });
      }

      res.json(result);
    } catch (e) {
      console.error("Transfer list error:", e);
      res.status(500).json({ message: "Gagal mengambil daftar transfer" });
    }
  });

  app.post(api.transfers.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { stockTransfers, stockTransferItems } = await import("@shared/schema");

      const { fromBranchId, toBranchId, items, notes, transferredBy, driverName } = req.body;

      const [transfer] = await db.insert(stockTransfers).values({
        fromBranchId,
        toBranchId,
        status: "in_transit",
        transferredBy: transferredBy || "Admin",
        driverName: driverName || null,
        notes,
        userId: adminId,
      }).returning();

      // Deduct stock from source
      for (const item of items) {
        await db.insert(stockTransferItems).values({
          transferId: transfer.id,
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || null,
        });

        // Deduct from source product stock
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(product.id, {
            currentStock: Math.max(0, product.currentStock - item.quantity),
          });
        }
      }

      // Audit Log
      await storage.createAuditLog({
        action: "STOCK_TRANSFER_CREATED",
        entityType: "stock_transfer",
        entityId: transfer.id,
        userId: adminId,
        details: {
          fromBranchId,
          toBranchId,
          itemCount: items.length,
          totalQty: items.reduce((s: number, i: any) => s + i.quantity, 0),
        }
      });

      res.status(201).json(transfer);
    } catch (e) {
      console.error("Transfer create error:", e);
      res.status(500).json({ message: "Gagal membuat transfer" });
    }
  });

  app.get(api.transfers.get.path, isAuthenticated, async (req, res) => {
    try {
      const { stockTransfers, stockTransferItems, branches: branchesTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = Number(req.params.id);

      const [transfer] = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id));
      if (!transfer) return res.status(404).json({ message: "Transfer tidak ditemukan" });

      const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));
      const enrichedItems = [];
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        enrichedItems.push({ ...item, product: product || null });
      }

      const fromBranch = transfer.fromBranchId
        ? (await db.select().from(branchesTable).where(eq(branchesTable.id, transfer.fromBranchId)))[0] || null
        : null;
      const toBranch = transfer.toBranchId
        ? (await db.select().from(branchesTable).where(eq(branchesTable.id, transfer.toBranchId)))[0] || null
        : null;

      res.json({ ...transfer, items: enrichedItems, fromBranch, toBranch });
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil detail transfer" });
    }
  });

  app.post(api.transfers.receive.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const { stockTransfers, stockTransferItems } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = Number(req.params.id);
      const { receivedBy, itemsReceived } = req.body;

      const [transfer] = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id));
      if (!transfer) return res.status(404).json({ message: "Transfer tidak ditemukan" });
      if (transfer.status === "received") return res.status(400).json({ message: "Transfer sudah diterima" });

      // Update each item with received qty
      const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));

      for (const item of items) {
        const receivedQty = itemsReceived
          ? (itemsReceived.find((r: any) => r.productId === item.productId)?.receivedQuantity ?? item.quantity)
          : item.quantity;

        await db.update(stockTransferItems)
          .set({ receivedQuantity: receivedQty })
          .where(eq(stockTransferItems.id, item.id));

        // Add stock to destination
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(product.id, {
            currentStock: product.currentStock + receivedQty,
          });
        }
      }

      // Mark transfer as received
      const [updated] = await db.update(stockTransfers)
        .set({ status: "received", receivedBy: receivedBy || "Admin", receivedAt: new Date() })
        .where(eq(stockTransfers.id, id))
        .returning();

      // Audit
      const adminId = await getTeamAdminId(req);
      await storage.createAuditLog({
        action: "STOCK_TRANSFER_RECEIVED",
        entityType: "stock_transfer",
        entityId: id,
        userId: adminId,
        details: { receivedBy, itemCount: items.length },
      });

      res.json(updated);
    } catch (e) {
      console.error("Transfer receive error:", e);
      res.status(500).json({ message: "Gagal menerima transfer" });
    }
  });

  app.post(api.transfers.cancel.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { stockTransfers, stockTransferItems } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = Number(req.params.id);

      const [transfer] = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id));
      if (!transfer) return res.status(404).json({ message: "Transfer tidak ditemukan" });
      if (transfer.status === "received") return res.status(400).json({ message: "Tidak bisa membatalkan transfer yang sudah diterima" });

      // Restore stock to source
      const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(product.id, {
            currentStock: product.currentStock + item.quantity,
          });
        }
      }

      const [updated] = await db.update(stockTransfers)
        .set({ status: "cancelled" })
        .where(eq(stockTransfers.id, id))
        .returning();

      const adminId = await getTeamAdminId(req);
      await storage.createAuditLog({
        action: "STOCK_TRANSFER_CANCELLED",
        entityType: "stock_transfer",
        entityId: id,
        userId: adminId,
        details: { reason: req.body.reason || "Tanpa alasan" },
      });

      res.json(updated);
    } catch (e) {
      res.status(500).json({ message: "Gagal membatalkan transfer" });
    }
  });

  // === Branches ===
  app.get(api.branches.list.path, isAuthenticated, async (req, res) => {
    try {
      const { branches: branchesTable } = await import("@shared/schema");
      const adminId = await getTeamAdminId(req);
      const results = await db.select().from(branchesTable).where(eq(branchesTable.userId, adminId));
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil daftar cabang" });
    }
  });

  // === Phase 11: Purchase Orders (Procurement) & Suppliers ===
  app.get(api.procurement.suppliers.list.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const suppliers = await storage.getSuppliers(adminId);
      res.json(suppliers);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar supplier" });
    }
  });

  app.post(api.procurement.suppliers.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const supplier = await storage.createSupplier({ ...req.body, userId: adminId });
      res.status(201).json(supplier);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat supplier" });
    }
  });

  app.put(api.procurement.suppliers.update.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const supplier = await storage.updateSupplier(Number(req.params.id), req.body);
      res.json(supplier);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengupdate supplier" });
    }
  });

  app.get(api.procurement.list.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const pos = await storage.getPurchaseOrders(adminId);
      res.json(pos);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar PO" });
    }
  });

  app.post(api.procurement.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const newPo = await storage.createPurchaseOrder({ ...req.body.po, userId: adminId, status: "sent" }, req.body.items);
      res.status(201).json(newPo);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat PO" });
    }
  });

  app.post(api.procurement.complete.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const session = await storage.completePurchaseOrder(Number(req.params.id));
      res.json(session);
    } catch (e) {
      res.status(500).json({ message: "Gagal menyelesaikan PO" });
    }
  });

  app.post(api.procurement.approve.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { purchaseOrders } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { db } = await import("./db");

      const [updated] = await db.update(purchaseOrders)
        .set({ status: 'sent', updatedAt: new Date() })
        .where(eq(purchaseOrders.id, Number(req.params.id)))
        .returning();
      res.json(updated);
    } catch (e) {
      res.status(500).json({ message: "Gagal menyetujui PO" });
    }
  });

  // === Phase 12: B2B Wholesale (Pricing & Bundling) ===
  app.get("/api/pricing/tiered", isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const tiers = await storage.getTieredPricingAll(adminId);
      res.json(tiers);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil data paket harga" });
    }
  });

  app.get(api.pricing.tiered.list.path, isAuthenticated, async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const tiers = await storage.getTieredPricing(productId);
      res.json(tiers);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil paket harga" });
    }
  });

  app.post(api.pricing.tiered.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const tier = await storage.createTieredPricing({ ...req.body, userId: adminId });
      res.status(201).json(tier);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat paket harga" });
    }
  });

  app.delete(api.pricing.tiered.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteTieredPricing(Number(req.params.id));
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Gagal menghapus paket harga" });
    }
  });

  app.get(api.bundling.list.path, isAuthenticated, async (req, res) => {
    try {
      const parentProductId = Number(req.params.parentProductId);
      const bundles = await storage.getProductBundles(parentProductId);
      res.json(bundles);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil data bundle" });
    }
  });

  app.post(api.bundling.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const bundle = await storage.createProductBundle(req.body);
      res.status(201).json(bundle);
    } catch (e) {
      res.status(500).json({ message: "Gagal membuat bundle" });
    }
  });

  app.delete(api.bundling.delete.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteProductBundle(Number(req.params.id));
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Gagal menghapus bundle" });
    }
  });

  // === Phase 16: RMA & Sales Returns ===
  app.get(api.rma.list.path, isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const returns = await storage.getSalesReturns(adminId);
      res.json(returns);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar retur" });
    }
  });

  app.get('/api/rma/search', isAuthenticated, async (req, res) => {
    try {
      const { invoice } = req.query;
      if (!invoice) return res.status(400).json({ message: "Invoice diperlukan" });
      const { sales, customers, saleItems, products } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { db } = await import("./db");
      const sale = await db.query.sales.findFirst({
        where: eq(sales.invoiceNumber, String(invoice)),
        with: {
          customer: true,
          items: {
            with: { product: true }
          }
        }
      });
      if (!sale) return res.status(404).json({ message: "Invoice tidak ditemukan" });
      res.json(sale);
    } catch (e) {
      res.status(500).json({ message: "Gagal mencari invoice" });
    }
  });

  app.post(api.rma.create.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const newReturn = await storage.createSalesReturn({ ...req.body.returnData, userId: adminId }, req.body.items);

      // Audit
      await storage.createAuditLog({
        action: "SALES_RETURN_CREATED",
        entityType: "sales_return",
        entityId: newReturn.id,
        userId: adminId,
        details: { saleId: req.body.returnData.saleId, reason: req.body.returnData.reason }
      });

      res.status(201).json(newReturn);
    } catch (e) {
      res.status(500).json({ message: "Gagal memproses retur" });
    }
  });

  // === Phase 20: Analytics & Forecasting ===
  app.get(api.analytics.inventoryDemand.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const analytics = await storage.getInventoryDemand(adminId);
      res.json(analytics);
    } catch (e) {
      console.error("Demand analytics error:", e);
      res.status(500).json({ message: "Gagal memproses analitik permintaan" });
    }
  });

  app.get(api.analytics.categoryPerformance.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const performance = await storage.getCategoryPerformance(adminId);
      res.json(performance);
    } catch (e) {
      console.error("Category performance error:", e);
      res.status(500).json({ message: "Gagal mengambil data performa kategori" });
    }
  });

  app.get(api.analytics.inventoryAging.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const aging = await storage.getInventoryAging(adminId);
      res.json(aging);
    } catch (e) {
      console.error("Inventory aging error:", e);
      res.status(500).json({ message: "Gagal mengambil data penuaan stok" });
    }
  });

  app.get(api.analytics.salesForecast.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const forecast = await storage.getSalesForecast(adminId);
      res.json(forecast);
    } catch (e) {
      console.error("Sales forecast error:", e);
      res.status(500).json({ message: "Gagal memproses ramalan penjualan" });
    }
  });

  // === Phase 13: Smart AI Insights ===
  app.get(api.analytics.aiInsights.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Gemini API Key tidak terkonfigurasi" });
      }

      // 1. Gather Data for AI
      const allProducts = await storage.getProducts(adminId);
      const { saleItems: saleItemsTable, sales: salesTable } = await import("@shared/schema");
      const { eq, gte, and, sql, desc: drc } = await import("drizzle-orm");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Top Selling
      const topSelling = await db.select({
        productId: saleItemsTable.productId,
        name: products.name,
        totalSold: sql<number>`sum(${saleItemsTable.quantity})`
      })
        .from(saleItemsTable)
        .innerJoin(products, eq(saleItemsTable.productId, products.id))
        .innerJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
        .where(and(eq(products.userId, adminId), gte(salesTable.createdAt, thirtyDaysAgo)))
        .groupBy(saleItemsTable.productId, products.name)
        .orderBy(sql`sum(${saleItemsTable.quantity}) DESC`)
        .limit(5);

      // Low Stock
      const lowStock = allProducts
        .filter(p => p.currentStock <= p.minStock)
        .slice(0, 5)
        .map(p => ({ name: p.name, stock: p.currentStock, min: p.minStock }));

      // 2. call Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Anda adalah asisten cerdas Kazana ERP (Sistem Manajemen Inventaris).
        Berikut adalah data bisnis dalam 30 hari terakhir:
        - Produk Terlaris: ${JSON.stringify(topSelling)}
        - Stok Menipis: ${JSON.stringify(lowStock)}

        Berikan 3-4 poin wawasan bisnis (Smart Insights) yang singkat, padat, dan proaktif untuk pemilik bisnis.
        KEMBALIKAN HANYA ARRAY JSON VALID. JANGAN ADA TEKS LAIN.
        Format poin-poin tersebut dalam JSON array berkategori: "title", "content", "type" (info, warning, success).
        Gunakan Bahasa Indonesia yang profesional.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON if AI surrounds it with markdown
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      res.json(insights);
    } catch (e) {
      console.error("AI Insights error:", e);
      res.status(500).json({ message: "Gagal mendapatkan wawasan AI" });
    }
  });

  app.get(api.analytics.stockHealth.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const health = await storage.getStockHealth(adminId);
      res.json(health);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil kesehatan stok" });
    }
  });

  // === Phase 15: Expiry Alerts ===
  app.get(api.alerts.expiringSoon.path, isAuthenticated, requireRole("admin", "sku_manager"), async (req, res) => {
    try {
      const { inventoryLots } = await import("@shared/schema");
      const { gte, lte, and, eq, gt } = await import("drizzle-orm");

      const adminId = await getTeamAdminId(req); // Filter by admin via product join maybe, but let's keep it simple

      const now = new Date();
      const inThirtyDays = new Date();
      inThirtyDays.setDate(inThirtyDays.getDate() + 30);

      const expiringLots = await db.select().from(inventoryLots)
        .where(and(
          gt(inventoryLots.remainingQuantity, 0),
          gte(inventoryLots.expiryDate, now),
          lte(inventoryLots.expiryDate, inThirtyDays)
        ));

      const result = [];
      for (const lot of expiringLots) {
        const product = await storage.getProduct(lot.productId);
        result.push({ ...lot, product });
      }

      res.json(result);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil peringatan kadaluarsa" });
    }
  });

  // === Phase 16: RMA & Sales Returns ===
  app.get(api.rma.list.path, isAuthenticated, requireRole("admin", "cashier", "sku_manager"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const returns = await storage.getSalesReturns(adminId);
      res.json(returns);
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar retur" });
    }
  });

  app.post(api.rma.create.path, isAuthenticated, requireRole("admin", "cashier"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { saleId, returnNumber, reason, refundAmount, refundMethod, notes, items } = req.body;

      if (!saleId || !items || items.length === 0) {
        return res.status(400).json({ message: "Data retur tidak lengkap" });
      }

      const result = await storage.createSalesReturn(adminId, {
        saleId,
        returnNumber,
        reason,
        refundAmount,
        refundMethod,
        notes
      }, items);

      res.status(201).json(result);
    } catch (e: any) {
      console.error("Create RMA Error:", e);
      res.status(500).json({ message: e.message || "Gagal memproses retur" });
    }
  });

  app.get("/api/sales/find/:receiptNumber", isAuthenticated, async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const { receiptNumber } = req.params;

      const { sales } = await import("@shared/schema");
      const { eq, or, and } = await import("drizzle-orm");

      const sale = await db.query.sales.findFirst({
        where: and(
          eq(sales.userId, adminId),
          or(eq(sales.uuid, receiptNumber), eq(sales.orderId, receiptNumber))
        ),
        with: {
          items: { with: { product: true } },
          customer: true
        }
      });

      if (!sale) {
        return res.status(404).json({ message: "Nota penjualan tidak ditemukan" });
      }

      res.json(sale);
    } catch (e) {
      res.status(500).json({ message: "Gagal mencari nota" });
    }
  });

  // === Phase 14: Global Cloud Sync & Backup ===
  app.get(api.backup.stats.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const adminId = await getTeamAdminId(req);
      const sessionList = await db.select().from(opnameSessions).where(eq(opnameSessions.userId, adminId));

      const stats = {
        totalSessions: sessionList.length,
        pendingBackup: sessionList.filter(s => s.status === "completed" && !s.gDriveUrl).length,
        backedUp: sessionList.filter(s => !!s.gDriveUrl).length,
        lastBackup: sessionList.filter(s => !!s.gDriveUrl).sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0))[0]?.startedAt
      };

      res.json(stats);
    } catch (e) {
      console.error("Backup stats error:", e);
      res.status(500).json({ message: "Gagal mengambil statistik backup" });
    }
  });

  app.post(api.backup.run.path, isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { processBackup } = await import("../scripts/backup-gdrive");

      // We run it asynchrously to avoid blocking
      processBackup().catch(err => console.error("Batch backup background error:", err));

      res.json({ message: "Proses sinkronisasi cloud telah dimulai di latar belakang" });
    } catch (e) {
      res.status(500).json({ message: "Gagal menjalankan backup" });
    }
  });

  // Infrastructure Diagnostics
  app.get("/api/admin/diagnostics", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        storage: {
          path: path.join(process.cwd(), "uploads"),
          exists: fs.existsSync(path.join(process.cwd(), "uploads")),
          writable: false
        },
        database: {
          connected: true,
        }
      };

      try {
        fs.accessSync(diagnostics.storage.path, fs.constants.W_OK);
        diagnostics.storage.writable = true;
      } catch (e) { }

      res.json(diagnostics);
    } catch (e) {
      res.status(500).json({ message: "Diagnosis gagal" });
    }
  });

  return httpServer;
}
