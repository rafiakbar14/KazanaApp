import { users, otpCodes, type User, type UpsertUser } from "@shared/models/auth";

import { db } from "../db";
import { eq, and, gt, lt } from "drizzle-orm";


export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;

  getOtpCode(emailOrPhone: string, code: string): Promise<{ id: number; emailOrPhone: string; code: string; expiresAt: Date } | undefined>;
  createOtpCode(emailOrPhone: string, code: string, expiresAt: Date): Promise<void>;
  deleteOtpCode(id: number): Promise<void>;
}


class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    if (!phone) return undefined;
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    // Try username
    let user = await this.getUserByUsername(identifier);
    if (user) return user;

    // Try email
    user = await this.getUserByEmail(identifier);
    if (user) return user;

    // Try phone
    user = await this.getUserByPhone(identifier);
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }


  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPin(userId: string, pin: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ posPin: pin })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getOtpCode(emailOrPhone: string, code: string) {
    const [otp] = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.emailOrPhone, emailOrPhone),
        eq(otpCodes.code, code),
        gt(otpCodes.expiresAt, new Date())
      )
    );
    return otp;
  }

  async createOtpCode(emailOrPhone: string, code: string, expiresAt: Date) {
    await db.delete(otpCodes).where(eq(otpCodes.emailOrPhone, emailOrPhone));
    await db.insert(otpCodes).values({ emailOrPhone, code, expiresAt });
  }

  async deleteOtpCode(id: number) {
    await db.delete(otpCodes).where(eq(otpCodes.id, id));
  }
}


export const authStorage = new AuthStorage();
