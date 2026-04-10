import type { Express } from "express";
import { authStorage } from "./storage";
import { storage } from "../storage";
import { isAuthenticated } from "./authLogic";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { userRoles } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq, or } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, firstName, lastName } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi" });
      }

      if (username.length < 3) {
        return res.status(400).json({ message: "Username minimal 3 karakter" });
      }

      if (password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return res.status(400).json({ message: "Password minimal 8 karakter, wajib mengandung huruf besar dan karakter spesial" });
      }

      const existing = await authStorage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username sudah digunakan" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await authStorage.createUser({
        username,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        adminId: null,
      });

      const superAdmins = ["rafbarpratama", "smpusat"];

      // Special handling for super admins
      if (superAdmins.includes(username)) {
        await authStorage.updateUser(user.id, {
          subscribedModules: ["pos", "accounting", "production", "inventory", "admin"],
        });
      }

      await db.insert(userRoles).values({
        userId: user.id,
        role: "admin",
      });

      (req.session as any).userId = user.id;

      const { password: _, ...safeUser } = user;
      
      await storage.createActivityLog({
        userId: user.id,
        action: "REGISTER",
        details: `User registered: ${username}`,
      });

      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Gagal mendaftar" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi" });
      }

      const user = await authStorage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Username atau password salah" });
      }

      if (!user.password) {
        return res.status(401).json({ message: "Akun ini menggunakan Google Login. Silakan login dengan Google." });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        // Special overlap check for the requested superadmin password
        if (username === "rafbarpratama" && password === "12345678") {
          // Allow and auto-upgrade
          await authStorage.updateUser(user.id, {
            subscribedModules: ["pos", "accounting", "production", "inventory", "admin"],
          });
        } else {
          return res.status(401).json({ message: "Username atau password salah" });
        }
      } else if (username === "rafbarpratama") {
        // Even if bcrypt password matches, ensure modules are locked in
        await authStorage.updateUser(user.id, {
          subscribedModules: ["pos", "accounting", "production", "inventory", "admin"],
        });
      }

      (req.session as any).userId = user.id;

      const { password: _, ...safeUser } = user;

      // Ensure session is saved to DB before sending response
      req.session.save((err) => {
        if (err) {
          console.error("[auth] Session save error:", err);
          return res.status(500).json({ message: "Gagal menyimpan sesi" });
        }
        console.log(`[auth] Login berhasil: ${username}`);
        
        // Log activity asynchronously
        storage.createActivityLog({
          userId: user.id,
          branchId: user.branchId,
          action: "LOGIN",
          details: `User logged in: ${username}`,
        }).catch(err => console.error("Failed to create login log:", err));

        res.json(safeUser);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Gagal login" });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ message: "Credential (ID Token) is required" });
      }

      // Verify Google Token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ message: "Invalid Google token" });
      }

      const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: profileImageUrl } = payload;

      // 1. Try find by googleId
      let user = await authStorage.getUserByGoogleId(googleId);

      // 2. If not found, try find by email
      if (!user && email) {
        const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
        if (existingByEmail) {
          // Link Google account to existing user
          user = await authStorage.updateUser(existingByEmail.id, { googleId, profileImageUrl: profileImageUrl || existingByEmail.profileImageUrl });
          console.log(`[auth] Linked Google account for existing user: ${email}`);
        }
      }

      // 3. If still not found, create new user
      if (!user) {
        const username = email ? email.split("@")[0] : `user_${googleId.slice(-5)}`;
        user = await authStorage.createUser({
          username,
          googleId,
          email,
          firstName,
          lastName,
          profileImageUrl,
          adminId: null, // Assume new Google users are admins of their own team initially
          subscribedModules: ["pos"], // Default modules
        });

        // Assign default role
        await db.insert(userRoles).values({
          userId: user.id,
          role: "admin",
        });

        console.log(`[auth] Created new user via Google: ${username}`);
      }

      (req.session as any).userId = user.id;

      const { password: _, ...safeUser } = user;

      // Log activity
      storage.createActivityLog({
        userId: user.id,
        branchId: user.branchId,
        action: "LOGIN_GOOGLE",
        details: `User logged in via Google: ${user.username}`,
      }).catch(err => console.error("Failed to create google login log:", err));

      res.json(safeUser);
    } catch (error) {
      console.error("Google Login error:", error);
      res.status(500).json({ message: "Gagal login dengan Google" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      let user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const superAdmins = ["rafbarpratama", "smpusat"];
      
      // Always ensure super admins have all modules
      if (superAdmins.includes(user.username) && (!user.subscribedModules?.includes("accounting") || !user.subscribedModules?.includes("production") || !user.subscribedModules?.includes("inventory") || !user.subscribedModules?.includes("admin"))) {
        user = await authStorage.updateUser(userId, {
          subscribedModules: ["pos", "accounting", "production", "inventory", "admin"],
        });
      }

      const { password: _, ...safeUser } = user;
      
      // Inherit subscribed modules from team admin if user is a sub-user
      if (safeUser.adminId) {
        const teamAdmin = await authStorage.getUser(safeUser.adminId);
        if (teamAdmin) {
          (safeUser as any).subscribedModules = teamAdmin.subscribedModules || ["pos"];
        }
      }

      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { firstName, lastName, username, currentPassword, newPassword } = req.body;

      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates: Record<string, any> = {};

      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      if (username && username !== user.username) {
        if (username.length < 3) {
          return res.status(400).json({ message: "Username minimal 3 karakter" });
        }
        const existing = await authStorage.getUserByUsername(username);
        if (existing) {
          return res.status(400).json({ message: "Username sudah digunakan" });
        }
        updates.username = username;
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Password lama wajib diisi" });
        }
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          return res.status(400).json({ message: "Password lama salah" });
        }
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
          return res.status(400).json({ message: "Password baru minimal 8 karakter, wajib mengandung huruf besar dan karakter spesial" });
        }
        updates.password = await bcrypt.hash(newPassword, 10);
      }

      updates.updatedAt = new Date();

      const updated = await authStorage.updateUser(userId, updates);
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Gagal memperbarui profil" });
    }
  });

  app.post("/api/auth/create-user", isAuthenticated, async (req, res) => {
    try {
      const adminId = (req.session as any).userId;
      const adminRole = await db.select().from(userRoles).where(
        eq(userRoles.userId, adminId)
      );
      if (!adminRole[0] || adminRole[0].role !== "admin") {
        return res.status(403).json({ message: "Hanya admin yang bisa membuat user" });
      }

      const { username, password, firstName, lastName, role, branchId } = req.body;
      
      const adminUser = await authStorage.getUser(adminId);
      const targetBranchId = branchId || (adminUser?.branchId);

      if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await authStorage.createUser({
        username,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        adminId,
        branchId: targetBranchId,
      });

      await db.insert(userRoles).values({
        userId: user.id,
        role,
      });
      
      await storage.createActivityLog({
        userId: adminId,
        action: "CREATE_USER",
        details: `Created user ${username} with role ${role} for branch ${targetBranchId}`,
        branchId: targetBranchId,
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json({ ...safeUser, role });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Gagal membuat user" });
    }
  });

  app.post("/api/auth/reset-password", isAuthenticated, async (req, res) => {
    try {
      const adminId = (req.session as any).userId;
      const adminRole = await db.select().from(userRoles).where(
        eq(userRoles.userId, adminId)
      );
      if (!adminRole[0] || adminRole[0].role !== "admin") {
        return res.status(403).json({ message: "Hanya admin yang bisa reset password" });
      }

      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ message: "User ID dan password baru wajib diisi" });
      }

      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        return res.status(400).json({ message: "Password baru minimal 8 karakter, wajib mengandung huruf besar dan karakter spesial" });
      }

      const targetUser = await authStorage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      if (targetUser.adminId !== adminId) {
        return res.status(403).json({ message: "Anda hanya bisa reset password anggota tim Anda" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await authStorage.updateUser(userId, { password: hashedPassword, updatedAt: new Date() });

      res.json({ message: "Password berhasil direset" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Gagal mereset password" });
    }
  });

  app.post("/api/auth/start-trial", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.trialEndsAt) {
        return res.status(400).json({ message: "Trial sudah pernah digunakan" });
      }

      const trialDuration = 14 * 24 * 60 * 60 * 1000; // 14 days
      const trialEndsAt = new Date(Date.now() + trialDuration);

      await authStorage.updateUser(userId, {
        trialEndsAt,
        subscribedModules: ["pos", "accounting", "production"], // Trial unlocks all
      });

      res.json({ message: "Trial 14 hari berhasil diaktifkan", trialEndsAt });
    } catch (error) {
      console.error("Start trial error:", error);
      res.status(500).json({ message: "Gagal mengaktifkan trial" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Gagal logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
}
