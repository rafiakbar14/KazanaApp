import { db } from "./db";
import {
  products, opnameSessions, opnameRecords, userRoles,
  productPhotos, productUnits, staffMembers, announcements,
  feedback, motivationMessages, opnameRecordPhotos, categoryPriorities,
  branches,
  inboundSessions, inboundItems, inboundItemPhotos,
  outboundSessions, outboundItems, outboundItemPhotos,
  boms, bomItems, assemblySessions,
  customers, sales, saleItems,
  accounts, journalEntries, journalItems, fixedAssets, users,
  posDevices, posRegistrationCodes, promotions,
  posSessions, posPettyCash, posPendingSales, vouchers, settings,
  tieredPricing, productBundles,
  categories, units,
  type Product, type InsertProduct,
  type OpnameSession, type InsertOpnameSession,
  type OpnameRecord,
  type OpnameSessionWithRecords,
  type UserRole, type InsertUserRole,
  type ProductPhoto, type InsertProductPhoto,
  type ProductUnit, type InsertProductUnit,
  type StaffMember, type InsertStaffMember,
  type Announcement, type InsertAnnouncement,
  type Feedback, type InsertFeedback,
  type Account, type InsertAccount,
  type JournalEntry, type InsertJournalEntry,
  type JournalItem, type InsertJournalItem,
  type FixedAsset, type InsertFixedAsset,
  type MotivationMessage, type InsertMotivationMessage,
  type OpnameRecordPhoto,
  type ProductWithPhotosAndUnits,
  type CategoryPriority,
  type Branch,
  type InboundSession, type InsertInboundSession,
  type InboundItem, type InsertInboundItem,
  type InboundSessionWithItems, type InboundItemPhoto,
  type OutboundSession, type InsertOutboundSession,
  type OutboundItem, type InsertOutboundItem,
  type OutboundSessionWithItems, type OutboundItemPhoto,
  type Bom, type InsertBom, type BomItem, type InsertBomItem,
  type AssemblySession, type InsertAssemblySession,
  type BomWithItems, type AssemblySessionWithBOM,
  type Customer, type InsertCustomer,
  type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem,
  type SaleWithItems,
  type PosDevice, type InsertPosDevice,
  type InsertPosRegistrationCode,
  type Promotion, type InsertPromotion,
  type PosSession, type InsertPosSession,
  type PosPettyCash, type InsertPosPettyCash,
  type PosPendingSale, type InsertPosPendingSale,
  type Voucher, type InsertVoucher,
  type Settings, type InsertSettings,
  type TieredPricing, type InsertTieredPricing,
  type ProductBundle, type InsertProductBundle,
  type Category, type InsertCategory,
  type Unit, type InsertUnit,
} from "@shared/schema";
import { eq, desc, and, inArray, gt, lt } from "drizzle-orm";

export interface IStorage {
  getProducts(userId: string, locationType?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  bulkResetStock(ids: number[], userId: string): Promise<void>;
  getProductsWithPhotosAndUnits(userId: string): Promise<ProductWithPhotosAndUnits[]>;

  getProductPhotos(productId: number): Promise<ProductPhoto[]>;
  addProductPhoto(data: InsertProductPhoto): Promise<ProductPhoto>;
  deleteProductPhoto(id: number): Promise<void>;

  getProductUnits(productId: number): Promise<ProductUnit[]>;
  addProductUnit(data: InsertProductUnit): Promise<ProductUnit>;
  updateProductUnit(id: number, data: Partial<InsertProductUnit>): Promise<ProductUnit>;
  deleteProductUnit(id: number): Promise<void>;

  getSessions(userId: string, locationType?: string): Promise<OpnameSession[]>;
  getSession(id: number): Promise<OpnameSessionWithRecords | undefined>;
  createSession(session: InsertOpnameSession): Promise<OpnameSession>;
  completeSession(id: number): Promise<OpnameSession>;
  setSessionBackupStatus(id: number, status: string): Promise<OpnameSession>;
  updateSession(id: number, updates: Partial<InsertOpnameSession>): Promise<OpnameSession>;

  updateRecord(sessionId: number, productId: number, actualStock: number, notes?: string, unitValues?: string, countedBy?: string, returnedQuantity?: number, returnedNotes?: string): Promise<OpnameRecord>;
  updateRecordPhoto(sessionId: number, productId: number, photoUrl: string): Promise<OpnameRecord>;

  getRecordPhotos(recordId: number): Promise<OpnameRecordPhoto[]>;
  addRecordPhoto(data: { recordId: number; url: string }): Promise<OpnameRecordPhoto>;
  deleteRecordPhoto(id: number): Promise<void>;

  getUserRole(userId: string): Promise<UserRole | undefined>;
  setUserRole(data: InsertUserRole): Promise<UserRole>;
  getAllUserRoles(): Promise<UserRole[]>;

  getStaffMembers(userId: string): Promise<StaffMember[]>;
  createStaffMember(data: InsertStaffMember): Promise<StaffMember>;
  updateStaffMember(id: number, data: Partial<InsertStaffMember>): Promise<StaffMember>;
  deleteStaffMember(id: number): Promise<void>;

  getAnnouncements(userId: string): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  getFeedback(userId: string): Promise<Feedback[]>;
  createFeedback(data: InsertFeedback): Promise<Feedback>;
  deleteFeedback(id: number): Promise<void>;
  getAllFeedback(): Promise<Feedback[]>;

  getMotivationMessages(userId: string): Promise<MotivationMessage[]>;
  createMotivationMessage(data: InsertMotivationMessage): Promise<MotivationMessage>;
  updateMotivationMessage(id: number, data: Partial<InsertMotivationMessage>): Promise<MotivationMessage>;
  deleteMotivationMessage(id: number): Promise<void>;

  getCategoryPriorities(userId: string): Promise<CategoryPriority[]>;
  setCategoryPriorities(userId: string, priorities: { categoryName: string; sortOrder: number }[]): Promise<CategoryPriority[]>;

  // === Inbound ===
  getInboundSessions(userId: string): Promise<InboundSession[]>;
  getInboundSession(id: number): Promise<InboundSessionWithItems | undefined>;
  createInboundSession(session: InsertInboundSession): Promise<InboundSession>;
  completeInboundSession(id: number): Promise<InboundSession>;
  addInboundItem(item: InsertInboundItem): Promise<InboundItem>;
  removeInboundItem(id: number): Promise<void>;
  addInboundItemPhoto(itemId: number, url: string): Promise<InboundItemPhoto>;
  deleteInboundItemPhoto(id: number): Promise<void>;
  updateInboundSignatures(id: number, data: Partial<InboundSession>): Promise<InboundSession>;

  // === Outbound ===
  getOutboundSessions(userId: string): Promise<OutboundSession[]>;
  getOutboundSession(id: number): Promise<OutboundSessionWithItems | undefined>;
  createOutboundSession(session: InsertOutboundSession): Promise<OutboundSession>;
  completeOutboundSession(id: number): Promise<OutboundSession>;
  addOutboundItem(item: InsertOutboundItem): Promise<OutboundItem>;
  removeOutboundItem(id: number): Promise<void>;
  addOutboundItemPhoto(itemId: number, url: string): Promise<OutboundItemPhoto>;
  deleteOutboundItemPhoto(id: number): Promise<void>;
  updateOutboundSignatures(id: number, data: Partial<OutboundSession>): Promise<OutboundSession>;
  getBranches(): Promise<Branch[]>;

  createAssemblySession(session: InsertAssemblySession): Promise<AssemblySession>;
  completeAssemblySession(id: number): Promise<AssemblySession>;

  // === POS & Sales ===
  getSales(userId: string): Promise<SaleWithItems[]>;
  getSale(id: number): Promise<SaleWithItems | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems>;
  updateInvoiceStatus(id: number, userId: string, status: string): Promise<void>;
  voidSale(id: number, userId: string): Promise<Sale>;
  autoJournalVoid(saleId: number, userId: string, totalAmount: number, items: { productId: number; quantity: number; unitPrice: number }[], type: string): Promise<void>;

  // Promotions
  getPromotions(userId: string): Promise<Promotion[]>;
  createPromotion(promo: InsertPromotion): Promise<Promotion>;
  deletePromotion(id: number): Promise<void>;
  getActivePromotions(userId: string): Promise<Promotion[]>;

  getCustomers(userId: string): Promise<Customer[]>;
  getCustomersWithStats(userId: string): Promise<(Customer & { totalSpent: number; totalOrders: number; lastOrderDate: Date | null })[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateUserPin(userId: string, pin: string): Promise<void>;

  // === Accounting ===
  getAccounts(userId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  getJournalEntries(userId: string): Promise<(JournalEntry & { items: JournalItem[] })[]>;
  createJournalEntry(entry: InsertJournalEntry, items: Omit<InsertJournalItem, "entryId" | "id">[]): Promise<JournalEntry>;
  getFixedAssets(userId: string): Promise<FixedAsset[]>;
  createFixedAsset(asset: InsertFixedAsset): Promise<FixedAsset>;

  // === POS Devices ===
  getPosDevice(deviceId: string): Promise<PosDevice | undefined>;
  getPosDevices(userId: string): Promise<PosDevice[]>;
  createPosDevice(device: InsertPosDevice): Promise<PosDevice>;
  deletePosDevice(id: number): Promise<void>;
  getPosRegistrationCode(code: string): Promise<any>;
  createPosRegistrationCode(data: any): Promise<any>;
  deleteExpiredRegistrationCodes(userId: string): Promise<void>;
  deleteRegistrationCode(code: string): Promise<void>;
  assignPosDeviceUser(deviceId: string, userId: string | null): Promise<void>;

  // === POS ECOSYSTEM ===
  getPOSSessions(userId: string): Promise<PosSession[]>;
  getActivePOSSession(userId: string): Promise<PosSession | undefined>;
  createPOSSession(session: InsertPosSession): Promise<PosSession>;
  closePOSSession(id: number, data: { closingBalance: number; actualCash: number; notes?: string }): Promise<PosSession>;
  getPettyCash(sessionId: number): Promise<PosPettyCash[]>;
  createPettyCash(data: InsertPosPettyCash): Promise<PosPettyCash>;
  getPendingSales(sessionId: number): Promise<PosPendingSale[]>;
  savePendingSale(data: InsertPosPendingSale): Promise<PosPendingSale>;
  deletePendingSale(id: number): Promise<void>;

  // Vouchers
  getVouchers(userId: string): Promise<Voucher[]>;
  getVoucherByCode(userId: string, code: string): Promise<Voucher | undefined>;
  createVoucher(voucher: InsertVoucher): Promise<Voucher>;
  deleteVoucher(id: number): Promise<void>;

  // Settings
  getSettings(userId: string): Promise<Settings | undefined>;
  updateSettings(userId: string, data: Partial<InsertSettings>): Promise<Settings>;

  // Pricing & Bundling
  getTieredPricing(productId: number): Promise<TieredPricing[]>;
  createTieredPricing(data: InsertTieredPricing): Promise<TieredPricing>;
  deleteTieredPricing(id: number): Promise<void>;
  getProductBundles(parentProductId: number): Promise<ProductBundle[]>;
  createProductBundle(data: InsertProductBundle): Promise<ProductBundle>;
  deleteProductBundle(id: number): Promise<void>;

  // Categories & Units
  getCategories(userId: string): Promise<Category[]>;
  createCategory(data: InsertCategory & { userId: string }): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  getUnits(userId: string): Promise<Unit[]>;
  createUnit(data: InsertUnit & { userId: string }): Promise<Unit>;
  updateUnit(id: number, data: Partial<InsertUnit>): Promise<Unit>;
  deleteUnit(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(userId: string, locationType?: string): Promise<Product[]> {
    if (locationType) {
      return await db.select().from(products).where(and(eq(products.userId, userId), eq(products.locationType, locationType as "toko" | "gudang"))).orderBy(products.sku);
    }
    return await db.select().from(products).where(eq(products.userId, userId)).orderBy(products.sku);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async bulkResetStock(ids: number[], userId: string): Promise<void> {
    await db.update(products).set({ currentStock: 0 }).where(and(inArray(products.id, ids), eq(products.userId, userId)));
  }

  async getProductsWithPhotosAndUnits(userId: string): Promise<ProductWithPhotosAndUnits[]> {
    const result = await db.query.products.findMany({
      where: eq(products.userId, userId),
      with: {
        photos: true,
        units: true,
      },
      orderBy: products.sku,
    });
    return result;
  }

  async getProductPhotos(productId: number): Promise<ProductPhoto[]> {
    return await db.select().from(productPhotos).where(eq(productPhotos.productId, productId));
  }

  async addProductPhoto(data: InsertProductPhoto): Promise<ProductPhoto> {
    const [photo] = await db.insert(productPhotos).values(data).returning();
    return photo;
  }

  async deleteProductPhoto(id: number): Promise<void> {
    await db.delete(productPhotos).where(eq(productPhotos.id, id));
  }

  async getProductUnits(productId: number): Promise<ProductUnit[] | any> {
    return await db.select().from(productUnits).where(eq(productUnits.productId, productId)).orderBy(productUnits.sortOrder);
  }

  async addProductUnit(data: InsertProductUnit): Promise<ProductUnit> {
    const [unit] = await db.insert(productUnits).values(data).returning();
    return unit;
  }

  async updateProductUnit(id: number, data: Partial<InsertProductUnit>): Promise<ProductUnit> {
    const [unit] = await db.update(productUnits).set(data).where(eq(productUnits.id, id)).returning();
    return unit;
  }

  async deleteProductUnit(id: number): Promise<void> {
    await db.delete(productUnits).where(eq(productUnits.id, id));
  }

  async getSessions(userId: string, locationType?: string): Promise<OpnameSession[]> {
    if (locationType) {
      return await db.select().from(opnameSessions).where(and(eq(opnameSessions.userId, userId), eq(opnameSessions.locationType, locationType as "toko" | "gudang"))).orderBy(desc(opnameSessions.startedAt));
    }
    return await db.select().from(opnameSessions).where(eq(opnameSessions.userId, userId)).orderBy(desc(opnameSessions.startedAt));
  }

  async getSession(id: number): Promise<OpnameSessionWithRecords | undefined> {
    const [session] = await db.select().from(opnameSessions).where(eq(opnameSessions.id, id));
    if (!session) return undefined;

    const records = await db.query.opnameRecords.findMany({
      where: eq(opnameRecords.sessionId, id),
      with: {
        product: {
          with: {
            photos: true,
            units: true,
          },
        },
        photos: true,
      },
      orderBy: desc(opnameRecords.id)
    });

    return { ...session, records } as unknown as OpnameSessionWithRecords;
  }

  async createSession(insertSession: InsertOpnameSession): Promise<OpnameSession> {
    const [session] = await db.insert(opnameSessions).values(insertSession).returning();

    const sessionLocationType = insertSession.locationType;
    const allProducts = await this.getProducts(insertSession.userId, sessionLocationType ?? undefined);
    if (allProducts.length > 0) {
      const recordsToInsert = allProducts.map(p => ({
        sessionId: session.id,
        productId: p.id,
        actualStock: null as number | null,
      }));
      await db.insert(opnameRecords).values(recordsToInsert);
    }

    return session;
  }

  async completeSession(id: number): Promise<OpnameSession> {
    const [session] = await db.update(opnameSessions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(opnameSessions.id, id))
      .returning();

    const records = await db.select().from(opnameRecords).where(eq(opnameRecords.sessionId, id));
    for (const record of records) {
      if (record.actualStock !== null) {
        await db.update(products)
          .set({ currentStock: record.actualStock })
          .where(eq(products.id, record.productId));
      }
    }

    return session;
  }

  async setSessionGDriveUrl(id: number, gDriveUrl: string): Promise<OpnameSession> {
    const [session] = await db.update(opnameSessions)
      .set({ gDriveUrl })
      .where(eq(opnameSessions.id, id))
      .returning();
    return session;
  }

  async setSessionBackupStatus(id: number, backupStatus: string): Promise<OpnameSession> {
    const [session] = await db.update(opnameSessions)
      .set({ backupStatus: backupStatus as any })
      .where(eq(opnameSessions.id, id))
      .returning();
    return session;
  }

  async updateSession(id: number, updates: Partial<InsertOpnameSession>): Promise<OpnameSession> {
    const [session] = await db.update(opnameSessions)
      .set(updates)
      .where(eq(opnameSessions.id, id))
      .returning();
    return session;
  }

  async updateRecord(sessionId: number, productId: number, actualStock: number, notes?: string, unitValues?: string, countedBy?: string, returnedQuantity?: number, returnedNotes?: string): Promise<OpnameRecord> {
    const [existing] = await db.select().from(opnameRecords).where(
      and(eq(opnameRecords.sessionId, sessionId), eq(opnameRecords.productId, productId))
    );

    const updateData: Record<string, unknown> = { actualStock, notes };
    if (unitValues !== undefined) {
      updateData.unitValues = unitValues;
    }
    if (countedBy !== undefined) {
      updateData.countedBy = countedBy;
    }
    if (returnedQuantity !== undefined) {
      updateData.returnedQuantity = returnedQuantity;
    }
    if (returnedNotes !== undefined) {
      updateData.returnedNotes = returnedNotes;
    }

    if (existing) {
      const [updated] = await db.update(opnameRecords)
        .set(updateData)
        .where(eq(opnameRecords.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(opnameRecords).values({
        sessionId,
        productId,
        actualStock,
        notes,
        unitValues,
        countedBy,
        returnedQuantity: returnedQuantity ?? 0,
        returnedNotes
      }).returning();
      return created;
    }
  }

  async updateRecordPhoto(sessionId: number, productId: number, photoUrl: string): Promise<OpnameRecord> {
    const [existing] = await db.select().from(opnameRecords).where(
      and(eq(opnameRecords.sessionId, sessionId), eq(opnameRecords.productId, productId))
    );

    if (existing) {
      const [updated] = await db.update(opnameRecords)
        .set({ photoUrl })
        .where(eq(opnameRecords.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(opnameRecords).values({
        sessionId,
        productId,
        photoUrl
      }).returning();
      return created;
    }
  }

  async getRecordPhotos(recordId: number): Promise<OpnameRecordPhoto[]> {
    return await db.select().from(opnameRecordPhotos).where(eq(opnameRecordPhotos.recordId, recordId));
  }

  async addRecordPhoto(data: { recordId: number; url: string }): Promise<OpnameRecordPhoto> {
    const [photo] = await db.insert(opnameRecordPhotos).values(data).returning();
    return photo;
  }

  async deleteRecordPhoto(id: number): Promise<void> {
    await db.delete(opnameRecordPhotos).where(eq(opnameRecordPhotos.id, id));
  }

  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role;
  }

  async setUserRole(data: InsertUserRole): Promise<UserRole> {
    const [existing] = await db.select().from(userRoles).where(eq(userRoles.userId, data.userId));
    if (existing) {
      const [updated] = await db.update(userRoles)
        .set({ role: data.role })
        .where(eq(userRoles.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userRoles).values(data).returning();
    return created;
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles);
  }

  async getStaffMembers(userId: string): Promise<StaffMember[]> {
    return await db.select().from(staffMembers).where(eq(staffMembers.userId, userId));
  }

  async createStaffMember(data: InsertStaffMember): Promise<StaffMember> {
    const [member] = await db.insert(staffMembers).values(data).returning();
    return member;
  }

  async updateStaffMember(id: number, data: Partial<InsertStaffMember>): Promise<StaffMember> {
    const [member] = await db.update(staffMembers).set(data).where(eq(staffMembers.id, id)).returning();
    return member;
  }

  async deleteStaffMember(id: number): Promise<void> {
    await db.delete(staffMembers).where(eq(staffMembers.id, id));
  }

  async getAnnouncements(userId: string): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.userId, userId)).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(data).returning();
    return announcement;
  }

  async updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [announcement] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return announcement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getFeedback(userId: string): Promise<Feedback[]> {
    return await db.select().from(feedback).where(eq(feedback.userId, userId)).orderBy(desc(feedback.createdAt));
  }

  async createFeedback(data: InsertFeedback): Promise<Feedback> {
    const [fb] = await db.insert(feedback).values(data).returning();
    return fb;
  }

  async deleteFeedback(id: number): Promise<void> {
    await db.delete(feedback).where(eq(feedback.id, id));
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async getMotivationMessages(userId: string): Promise<MotivationMessage[]> {
    return await db.select().from(motivationMessages).where(eq(motivationMessages.userId, userId));
  }

  async createMotivationMessage(data: InsertMotivationMessage): Promise<MotivationMessage> {
    const [msg] = await db.insert(motivationMessages).values(data).returning();
    return msg;
  }

  async updateMotivationMessage(id: number, data: Partial<InsertMotivationMessage>): Promise<MotivationMessage> {
    const [msg] = await db.update(motivationMessages).set(data).where(eq(motivationMessages.id, id)).returning();
    return msg;
  }

  async deleteMotivationMessage(id: number): Promise<void> {
    await db.delete(motivationMessages).where(eq(motivationMessages.id, id));
  }

  async getCategoryPriorities(userId: string): Promise<CategoryPriority[]> {
    return await db.select().from(categoryPriorities).where(eq(categoryPriorities.userId, userId)).orderBy(categoryPriorities.sortOrder);
  }

  async setCategoryPriorities(userId: string, priorities: { categoryName: string; sortOrder: number }[]): Promise<CategoryPriority[]> {
    await db.delete(categoryPriorities).where(eq(categoryPriorities.userId, userId));
    if (priorities.length === 0) return [];
    const values = priorities.map(p => ({ categoryName: p.categoryName, sortOrder: p.sortOrder, userId }));
    return await db.insert(categoryPriorities).values(values).returning();
  }

  // === Inbound ===
  async getInboundSessions(userId: string): Promise<InboundSession[]> {
    return await db.select().from(inboundSessions).where(eq(inboundSessions.userId, userId)).orderBy(desc(inboundSessions.startedAt));
  }

  async getInboundSession(id: number): Promise<InboundSessionWithItems | undefined> {
    const session = await db.query.inboundSessions.findFirst({
      where: eq(inboundSessions.id, id),
      with: {
        items: {
          with: {
            product: true,
            photos: true,
          }
        }
      }
    });

    if (!session) return undefined;
    return session as unknown as InboundSessionWithItems;
  }

  async createInboundSession(session: InsertInboundSession): Promise<InboundSession> {
    const [result] = await db.insert(inboundSessions).values(session).returning();
    return result;
  }

  async completeInboundSession(id: number): Promise<InboundSession> {
    const [session] = await db.update(inboundSessions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(inboundSessions.id, id))
      .returning();

    // Update stock levels
    const items = await db.select().from(inboundItems).where(eq(inboundItems.sessionId, id));
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        await db.update(products)
          .set({ currentStock: product.currentStock + item.quantityReceived })
          .where(eq(products.id, item.productId));
      }
    }

    return session;
  }

  async addInboundItem(item: InsertInboundItem): Promise<InboundItem> {
    const [result] = await db.insert(inboundItems).values(item).returning();
    return result;
  }

  async removeInboundItem(id: number): Promise<void> {
    await db.delete(inboundItems).where(eq(inboundItems.id, id));
  }

  async addInboundItemPhoto(itemId: number, url: string): Promise<InboundItemPhoto> {
    const [photo] = await db.insert(inboundItemPhotos).values({ itemId, url }).returning();
    return photo;
  }

  async deleteInboundItemPhoto(id: number): Promise<void> {
    await db.delete(inboundItemPhotos).where(eq(inboundItemPhotos.id, id));
  }

  async updateInboundSignatures(id: number, data: Partial<InboundSession>): Promise<InboundSession> {
    const [session] = await db.update(inboundSessions)
      .set(data)
      .where(eq(inboundSessions.id, id))
      .returning();
    return session;
  }

  // === Outbound ===
  async getOutboundSessions(userId: string): Promise<OutboundSession[]> {
    return await db.select().from(outboundSessions).where(eq(outboundSessions.userId, userId)).orderBy(desc(outboundSessions.startedAt));
  }

  async getOutboundSession(id: number): Promise<OutboundSessionWithItems | undefined> {
    const session = await db.query.outboundSessions.findFirst({
      where: eq(outboundSessions.id, id),
      with: {
        items: {
          with: {
            product: true,
            photos: true,
          }
        },
        toBranch: true,
      }
    });

    if (!session) return undefined;
    return session as unknown as OutboundSessionWithItems;
  }

  async createOutboundSession(session: InsertOutboundSession): Promise<OutboundSession> {
    const [result] = await db.insert(outboundSessions).values(session).returning();
    return result;
  }

  async completeOutboundSession(id: number): Promise<OutboundSession> {
    const [session] = await db.update(outboundSessions)
      .set({ status: "shipped", shippedAt: new Date() })
      .where(eq(outboundSessions.id, id))
      .returning();

    const items = await db.select().from(outboundItems).where(eq(outboundItems.sessionId, id));

    // Update stock levels (decrement)
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        await db.update(products)
          .set({ currentStock: Math.max(0, product.currentStock - item.quantityShipped) })
          .where(eq(products.id, item.productId));
      }
    }

    // Auto-create Inbound session for the destination if it's a transfer
    if (session.toBranchId) {
      const [inboundSession] = await db.insert(inboundSessions).values([{
        title: `Kiriman: ${session.title}`,
        userId: session.userId,
        status: "in_progress",
        notes: `Otomatis dibuat dari Outbound #${session.id}. Harap verifikasi jumlah barang saat diterima.`,
      }]).returning();

      for (const item of items) {
        await db.insert(inboundItems).values([{
          sessionId: inboundSession.id,
          productId: item.productId,
          quantityReceived: item.quantityShipped,
          notes: item.notes,
        }]);
      }
    }

    return session;
  }

  async addOutboundItem(item: InsertOutboundItem): Promise<OutboundItem> {
    const [result] = await db.insert(outboundItems).values(item).returning();
    return result;
  }

  async removeOutboundItem(id: number): Promise<void> {
    await db.delete(outboundItems).where(eq(outboundItems.id, id));
  }

  async addOutboundItemPhoto(itemId: number, url: string): Promise<OutboundItemPhoto> {
    const [photo] = await db.insert(outboundItemPhotos).values({ itemId, url }).returning();
    return photo;
  }

  async deleteOutboundItemPhoto(id: number): Promise<void> {
    await db.delete(outboundItemPhotos).where(eq(outboundItemPhotos.id, id));
  }

  async updateOutboundSignatures(id: number, data: Partial<OutboundSession>): Promise<OutboundSession> {
    const [session] = await db.update(outboundSessions)
      .set(data)
      .where(eq(outboundSessions.id, id))
      .returning();
    return session;
  }
  async getBranches(): Promise<Branch[]> {
    return db.select().from(branches);
  }

  // === Production (BOM & Assembly) ===
  async getBOMs(userId: string): Promise<Bom[]> {
    return await db.select().from(boms).where(eq(boms.userId, userId));
  }

  async getBOM(id: number): Promise<BomWithItems | undefined> {
    const bom = await db.query.boms.findFirst({
      where: eq(boms.id, id),
      with: {
        items: {
          with: {
            product: true,
          }
        },
        targetProduct: true,
      }
    });

    if (!bom) return undefined;
    return bom as unknown as BomWithItems;
  }

  async createBOM(bom: InsertBom): Promise<Bom> {
    const [result] = await db.insert(boms).values(bom).returning();
    return result;
  }

  async updateBOM(id: number, updates: Partial<InsertBom>): Promise<Bom> {
    const [result] = await db.update(boms).set(updates).where(eq(boms.id, id)).returning();
    return result;
  }

  async deleteBOM(id: number): Promise<void> {
    await db.delete(boms).where(eq(boms.id, id));
  }

  async addBOMItem(item: InsertBomItem): Promise<BomItem> {
    const [result] = await db.insert(bomItems).values(item).returning();
    return result;
  }

  async removeBOMItem(id: number): Promise<void> {
    await db.delete(bomItems).where(eq(bomItems.id, id));
  }

  async getAssemblySessions(userId: string): Promise<AssemblySession[]> {
    return await db.select().from(assemblySessions).where(eq(assemblySessions.userId, userId)).orderBy(desc(assemblySessions.createdAt));
  }

  async getAssemblySession(id: number): Promise<AssemblySessionWithBOM | undefined> {
    const session = await db.query.assemblySessions.findFirst({
      where: eq(assemblySessions.id, id),
      with: {
        bom: {
          with: {
            targetProduct: true,
          }
        }
      }
    });

    if (!session) return undefined;
    return session as unknown as AssemblySessionWithBOM;
  }

  async createAssemblySession(session: InsertAssemblySession): Promise<AssemblySession> {
    const [result] = await db.insert(assemblySessions).values(session).returning();
    return result;
  }

  async completeAssemblySession(id: number): Promise<AssemblySession> {
    const [session] = await db.select().from(assemblySessions).where(eq(assemblySessions.id, id));
    if (!session) throw new Error("Assembly session not found");

    const bom = await this.getBOM(session.bomId);
    if (!bom) throw new Error("BOM not found");

    // Reduce material stock and increase finished product stock
    for (const item of bom.items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        await this.updateProduct(product.id, {
          currentStock: (product.currentStock || 0) - (item.quantityNeeded * session.quantityProduced)
        });
      }
    }

    const [targetProduct] = await db.select().from(products).where(eq(products.id, bom.targetProductId));
    if (targetProduct) {
      await this.updateProduct(targetProduct.id, {
        currentStock: (targetProduct.currentStock || 0) + session.quantityProduced
      });
    }

    const [updated] = await db.update(assemblySessions)
      .set({ status: "completed" })
      .where(eq(assemblySessions.id, id))
      .returning();
    return updated;
  }

  // === POS & Sales ===
  async getSales(userId: string): Promise<SaleWithItems[]> {
    const result = await db.query.sales.findMany({
      where: eq(sales.userId, userId),
      with: {
        items: { with: { product: true } },
        customer: true,
        salesperson: true
      },
      orderBy: [desc(sales.createdAt)]
    });
    return result.map(r => ({
      ...r,
      salespersonName: r.salesperson ? `${r.salesperson.firstName} ${r.salesperson.lastName}`.trim() : "Staff"
    })) as unknown as SaleWithItems[];
  }

  async getSale(id: number): Promise<SaleWithItems | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const items = await db.select().from(saleItems)
      .where(eq(saleItems.saleId, id))
      .leftJoin(products, eq(saleItems.productId, products.id));

    const [customer] = sale.customerId
      ? await db.select().from(customers).where(eq(customers.id, sale.customerId))
      : [null];

    const [salesperson] = sale.salespersonId
      ? await db.select().from(users).where(eq(users.id, sale.salespersonId))
      : [null];

    return {
      ...sale,
      customer,
      salespersonName: salesperson ? `${salesperson.firstName} ${salesperson.lastName}`.trim() : "Staff",
      items: items.map(i => ({ ...i.sale_items, product: i.products! }))
    } as unknown as SaleWithItems;
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems> {
    let saleData = { ...sale };

    // Auto-generate invoice number for ERP sales if not provided
    if (sale.type === "erp_invoice" && !sale.invoiceNumber) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await db.select().from(sales).where(eq(sales.userId, sale.userId));
      saleData.invoiceNumber = `INV-${dateStr}-${(count.length + 1).toString().padStart(4, "0")}`;
    }

    // Ambil sessionId aktif jika tidak diberikan tapi tipe nya pos
    if (sale.type === "pos" && !sale.sessionId) {
      const activeSession = await this.getActivePOSSession(sale.userId);
      if (activeSession) {
        saleData.sessionId = activeSession.id;
      }
    }

    const [newSale] = await db.insert(sales).values(saleData).returning();

    for (const item of items) {
      // Pastikan subtotal dihitung (qty * unitPrice - discount)
      const subtotal = (item.quantity * item.unitPrice) - (item.discountAmount || 0);

      await db.insert(saleItems).values({
        ...item,
        saleId: newSale.id,
        subtotal: subtotal,
        discountAmount: item.discountAmount || 0,
        appliedPromotionId: item.appliedPromotionId || null
      });

      // Auto-deduct stock
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        await this.updateProduct(product.id, {
          currentStock: (product.currentStock || 0) - item.quantity
        });
      }
    }

    // Create auto-journal entry
    await this.autoJournalSale(newSale.id, sale.userId, parseFloat(sale.totalAmount.toString()), items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unitPrice.toString())
    })), sale.type || "pos");

    return (await this.getSale(newSale.id))!;
  }

  async voidSale(id: number, userId: string): Promise<Sale> {
    const [sale] = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
    if (!sale) throw new Error("Sale not found");
    if (sale.paymentStatus === "voided") throw new Error("Sale is already voided");

    // 1. Update sale status
    const [updatedSale] = await db.update(sales)
      .set({
        paymentStatus: "voided",
        voidedAt: new Date(),
        voidedBy: userId
      })
      .where(eq(sales.id, id))
      .returning();

    // 2. Restore stock
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        await this.updateProduct(product.id, {
          currentStock: (product.currentStock || 0) + item.quantity
        });
      }
    }

    // 3. Reverse accounting entries (Journal Entry Reversal)
    await this.autoJournalVoid(id, userId, parseFloat(sale.totalAmount.toString()), items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unitPrice.toString())
    })), sale.type || "pos");

    return updatedSale;
  }

  async getCustomers(userId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc(customers.createdAt));
  }

  // === POS Devices ===
  async getPosDevice(deviceId: string): Promise<PosDevice | undefined> {
    const [device] = await db.select().from(posDevices).where(eq(posDevices.deviceId, deviceId));
    return device;
  }

  async getPosDevices(userId: string): Promise<any[]> {
    return await db.query.posDevices.findMany({
      where: eq(posDevices.userId, userId),
      with: {
        assignedUser: true
      },
      orderBy: desc(posDevices.createdAt)
    });
  }

  async createPosDevice(device: InsertPosDevice): Promise<PosDevice> {
    const [result] = await db.insert(posDevices).values(device).returning();
    return result;
  }

  async deletePosDevice(id: number): Promise<void> {
    await db.delete(posDevices).where(eq(posDevices.id, id));
  }

  async getPosRegistrationCode(code: string): Promise<any> {
    const [result] = await db.select().from(posRegistrationCodes).where(
      and(
        eq(posRegistrationCodes.code, code),
        gt(posRegistrationCodes.expiresAt, new Date())
      )
    );
    return result;
  }

  async createPosRegistrationCode(data: any): Promise<any> {
    const [result] = await db.insert(posRegistrationCodes).values(data).returning();
    return result;
  }

  async deleteExpiredRegistrationCodes(userId: string): Promise<void> {
    await db.delete(posRegistrationCodes).where(
      and(
        eq(posRegistrationCodes.userId, userId),
        lt(posRegistrationCodes.expiresAt, new Date())
      )
    );
  }

  async deleteRegistrationCode(code: string): Promise<void> {
    await db.delete(posRegistrationCodes).where(eq(posRegistrationCodes.code, code));
  }

  async assignPosDeviceUser(deviceId: string, userId: string | null): Promise<void> {
    await db.update(posDevices).set({ assignedUserId: userId }).where(eq(posDevices.deviceId, deviceId));
  }

  async getPromotions(userId: string): Promise<Promotion[]> {
    return await db.select().from(promotions).where(eq(promotions.userId, userId));
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [result] = await db.insert(promotions).values(promotion).returning();
    return result;
  }

  async deletePromotion(id: number): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  async getActivePromotions(userId: string): Promise<Promotion[]> {
    const all = await this.getPromotions(userId);
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    return all.filter(p => {
      if (p.active !== 1) return false;
      if (p.daysOfWeek) {
        const days = p.daysOfWeek.split(',').map(Number);
        if (!days.includes(day)) return false;
      }
      if (p.startTime && time < p.startTime) return false;
      if (p.endTime && time > p.endTime) return false;
      return true;
    });
  }

  async getCustomersWithStats(userId: string): Promise<(Customer & { totalSpent: number; totalOrders: number; lastOrderDate: Date | null })[]> {
    const allCustomers = await this.getCustomers(userId);
    const result = [];

    for (const customer of allCustomers) {
      const customerSales = await db.select().from(sales).where(eq(sales.customerId, customer.id));
      const totalSpent = customerSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const totalOrders = customerSales.length;
      const lastOrderDate = customerSales.length > 0
        ? new Date(Math.max(...customerSales.map(s => new Date(s.createdAt).getTime())))
        : null;

      result.push({
        ...customer,
        totalSpent,
        totalOrders,
        lastOrderDate,
      });
    }

    return result as any[];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateUserPin(userId: string, pin: string): Promise<void> {
    await db.update(users).set({ posPin: pin }).where(eq(users.id, userId));
  }

  // === Accounting ===
  async getAccounts(userId: string): Promise<Account[]> {
    await this.ensureDefaultAccounts(userId);
    return await db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(accounts.code);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async getJournalEntries(userId: string): Promise<(JournalEntry & { items: JournalItem[] })[]> {
    const entries = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.date));
    const result = [];
    for (const entry of entries) {
      const items = await db.select().from(journalItems).where(eq(journalItems.entryId, entry.id));
      result.push({ ...entry, items });
    }
    return result;
  }

  async createJournalEntry(entry: InsertJournalEntry, items: Omit<InsertJournalItem, "entryId" | "id">[]): Promise<JournalEntry> {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    for (const item of items) {
      await db.insert(journalItems).values({ ...item, entryId: newEntry.id } as InsertJournalItem);
    }
    return newEntry;
  }

  async getFixedAssets(userId: string): Promise<FixedAsset[]> {
    return await db.select().from(fixedAssets).where(eq(fixedAssets.userId, userId)).orderBy(desc(fixedAssets.purchaseDate));
  }

  async createFixedAsset(asset: InsertFixedAsset): Promise<FixedAsset> {
    const [newAsset] = await db.insert(fixedAssets).values(asset).returning();
    return newAsset;
  }

  // === Internal Accounting Helpers ===
  private async ensureDefaultAccounts(userId: string) {
    const existing = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
    if (existing.length === 0) {
      const defaults: InsertAccount[] = [
        { code: "1101", name: "Kas di Tangan", type: "asset", userId },
        { code: "1102", name: "Bank BCA", type: "asset", userId },
        { code: "1103", name: "Piutang Usaha", type: "asset", userId },
        { code: "1201", name: "Persediaan Barang Dagang", type: "asset", userId },
        { code: "1301", name: "Aset Tetap - Peralatan", type: "asset", userId },
        { code: "2101", name: "Hutang Usaha", type: "liability", userId },
        { code: "3101", name: "Modal Pemilik", type: "equity", userId },
        { code: "4101", name: "Penjualan Barang", type: "income", userId },
        { code: "5101", name: "Harga Pokok Penjualan (HPP)", type: "expense", userId },
        { code: "5201", name: "Biaya Operasional", type: "expense", userId },
      ];
      await db.insert(accounts).values(defaults);
    }
  }

  async autoJournalSale(saleId: number, userId: string, totalAmount: number, items: { productId: number; quantity: number; unitPrice: number }[], type: string = "pos") {
    await this.ensureDefaultAccounts(userId);
    const userAccounts = await this.getAccounts(userId);

    const findAccount = (code: string) => userAccounts.find(a => a.code === code);
    const cashAcc = findAccount("1101");
    const salesAcc = findAccount("4101");
    const hppAcc = findAccount("5101");
    const invAcc = findAccount("1201");
    const receivableAcc = findAccount("1103");

    if (!cashAcc || !salesAcc || !hppAcc || !invAcc || !receivableAcc) return;

    // 1. Journal Sale
    // If POS: Debit Cash, Credit Sales
    // If ERP Invoice: Debit Accounts Receivable, Credit Sales
    const debitAccount = type === "pos" ? cashAcc.id : receivableAcc.id;
    const descPrefix = type === "pos" ? "Penjualan POS" : "Penjualan Invoice";

    await this.createJournalEntry(
      { description: `${descPrefix} #${saleId}`, reference: `SALE-${saleId}`, userId, date: new Date() },
      [
        { accountId: debitAccount, debit: totalAmount, credit: 0, userId },
        { accountId: salesAcc.id, debit: 0, credit: totalAmount, userId },
      ]
    );

    // 2. Journal COGS (Debit HPP, Credit Inventory)
    let totalCogs = 0;
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        totalCogs += (product.unitCost || 0) * item.quantity;
      }
    }

    if (totalCogs > 0) {
      await this.createJournalEntry(
        { description: `HPP ${descPrefix} #${saleId}`, reference: `SALE-${saleId}`, userId, date: new Date() },
        [
          { accountId: hppAcc.id, debit: totalCogs, credit: 0, userId },
          { accountId: invAcc.id, debit: 0, credit: totalCogs, userId },
        ]
      );
    }
  }

  async autoJournalVoid(saleId: number, userId: string, totalAmount: number, items: { productId: number; quantity: number; unitPrice: number }[], type: string = "pos") {
    await this.ensureDefaultAccounts(userId);
    const userAccounts = await this.getAccounts(userId);

    const findAccount = (code: string) => userAccounts.find(a => a.code === code);
    const cashAcc = findAccount("1101");
    const salesAcc = findAccount("4101");
    const hppAcc = findAccount("5101");
    const invAcc = findAccount("1201");
    const receivableAcc = findAccount("1103");

    if (!cashAcc || !salesAcc || !hppAcc || !invAcc || !receivableAcc) return;

    // 1. Reverse Sale Journal
    const creditAccount = type === "pos" ? cashAcc.id : receivableAcc.id;
    const descPrefix = type === "pos" ? "Void Penjualan POS" : "Void Penjualan Invoice";

    await this.createJournalEntry(
      { description: `${descPrefix} #${saleId}`, reference: `VOID-${saleId}`, userId, date: new Date() },
      [
        { accountId: salesAcc.id, debit: totalAmount, credit: 0, userId },
        { accountId: creditAccount, debit: 0, credit: totalAmount, userId },
      ]
    );

    // 2. Reverse COGS Journal
    let totalCogs = 0;
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        totalCogs += (product.unitCost || 0) * item.quantity;
      }
    }

    if (totalCogs > 0) {
      await this.createJournalEntry(
        { description: `Void HPP ${descPrefix} #${saleId}`, reference: `VOID-${saleId}`, userId, date: new Date() },
        [
          { accountId: invAcc.id, debit: totalCogs, credit: 0, userId },
          { accountId: hppAcc.id, debit: 0, credit: totalCogs, userId },
        ]
      );
    }
  }

  async getInvoices(userId: string): Promise<SaleWithItems[]> {
    const result = await db.query.sales.findMany({
      where: and(eq(sales.userId, userId), eq(sales.type, "erp_invoice")),
      with: {
        items: { with: { product: true } },
        customer: true,
        salesperson: true
      },
      orderBy: [desc(sales.createdAt)]
    });
    return result.map(r => ({
      ...r,
      salespersonName: r.salesperson ? `${r.salesperson.firstName} ${r.salesperson.lastName}`.trim() : "Staff"
    })) as unknown as SaleWithItems[];
  }

  async updateInvoiceStatus(id: number, userId: string, status: string): Promise<void> {
    const [invoice] = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
    if (!invoice) return;

    // If marking as paid, create journal entry: Debit Cash, Credit Accounts Receivable
    if (status === "paid" && invoice.paymentStatus !== "paid") {
      await this.ensureDefaultAccounts(userId);
      const userAccounts = await this.getAccounts(userId);
      const findAccount = (code: string) => userAccounts.find(a => a.code === code);
      const cashAcc = findAccount("1101");
      const receivableAcc = findAccount("1103");

      if (cashAcc && receivableAcc) {
        await this.createJournalEntry(
          {
            description: `Pelunasan Invoice #${invoice.invoiceNumber || id}`,
            reference: `PAY-${id}`,
            userId,
            date: new Date()
          },
          [
            { accountId: cashAcc.id, debit: Number(invoice.totalAmount), credit: 0, userId },
            { accountId: receivableAcc.id, debit: 0, credit: Number(invoice.totalAmount), userId },
          ]
        );
      }
    }

    await db.update(sales).set({ paymentStatus: status }).where(eq(sales.id, id));
  }

  // === POS ECOSYSTEM ===
  async getPOSSessions(userId: string): Promise<any[]> {
    const sessions = await db.select().from(posSessions).where(eq(posSessions.userId, userId)).orderBy(desc(posSessions.startTime));

    const enrichedSessions = await Promise.all(sessions.map(async (session) => {
      const sessionSales = await db.select().from(sales).where(and(eq(sales.sessionId, session.id), eq(sales.paymentStatus, "paid")));
      const totalSales = sessionSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const totalCashSales = sessionSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + Number(s.totalAmount), 0);

      const pettyCashEntries = await db.select().from(posPettyCash).where(eq(posPettyCash.sessionId, session.id));
      const pettyCashTotal = pettyCashEntries.reduce((sum, pc) => {
        return pc.type === 'in' ? sum + Number(pc.amount) : sum - Number(pc.amount);
      }, 0);

      return {
        ...session,
        totalSales,
        totalCashSales,
        pettyCashTotal
      };
    }));

    return enrichedSessions;
  }

  async getActivePOSSession(userId: string): Promise<any | undefined> {
    const [session] = await db.select().from(posSessions).where(and(eq(posSessions.userId, userId), eq(posSessions.status, "open"))).orderBy(desc(posSessions.startTime));
    if (!session) return undefined;

    // Calculate totals on the fly
    const sessionSales = await db.select().from(sales).where(and(eq(sales.sessionId, session.id), eq(sales.paymentStatus, "paid")));
    const totalSales = sessionSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalCashSales = sessionSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + Number(s.totalAmount), 0);

    const pettyCashEntries = await db.select().from(posPettyCash).where(eq(posPettyCash.sessionId, session.id));
    const pettyCashTotal = pettyCashEntries.reduce((sum, pc) => {
      return pc.type === 'in' ? sum + Number(pc.amount) : sum - Number(pc.amount);
    }, 0);

    return {
      ...session,
      totalSales,
      totalCashSales,
      pettyCashTotal
    };
  }

  async createPOSSession(session: InsertPosSession): Promise<PosSession> {
    const [result] = await db.insert(posSessions).values(session).returning();
    return result;
  }

  async closePOSSession(id: number, data: { closingBalance: number; actualCash: number; notes?: string }): Promise<PosSession> {
    const [result] = await db.update(posSessions)
      .set({ ...data, status: "closed", endTime: new Date() })
      .where(eq(posSessions.id, id))
      .returning();
    return result;
  }

  async getPettyCash(sessionId: number): Promise<PosPettyCash[]> {
    return await db.select().from(posPettyCash).where(eq(posPettyCash.sessionId, sessionId)).orderBy(desc(posPettyCash.createdAt));
  }

  async createPettyCash(data: InsertPosPettyCash): Promise<PosPettyCash> {
    const [result] = await db.insert(posPettyCash).values(data).returning();
    return result;
  }

  async getPendingSales(sessionId: number): Promise<PosPendingSale[]> {
    return await db.select().from(posPendingSales).where(eq(posPendingSales.sessionId, sessionId)).orderBy(desc(posPendingSales.createdAt));
  }

  async savePendingSale(data: InsertPosPendingSale): Promise<PosPendingSale> {
    const [result] = await db.insert(posPendingSales).values(data).returning();
    return result;
  }

  async deletePendingSale(id: number): Promise<void> {
    await db.delete(posPendingSales).where(eq(posPendingSales.id, id));
  }

  // Vouchers
  async getVouchers(userId: string): Promise<Voucher[]> {
    return await db.select().from(vouchers).where(eq(vouchers.userId, userId)).orderBy(desc(vouchers.createdAt));
  }

  async getVoucherByCode(userId: string, code: string): Promise<Voucher | undefined> {
    const [voucher] = await db.select().from(vouchers).where(and(eq(vouchers.userId, userId), eq(vouchers.code, code), eq(vouchers.active, 1)));
    return voucher;
  }

  async createVoucher(voucher: InsertVoucher): Promise<Voucher> {
    const [result] = await db.insert(vouchers).values(voucher).returning();
    return result;
  }

  async deleteVoucher(id: number): Promise<void> {
    await db.delete(vouchers).where(eq(vouchers.id, id));
  }

  // Settings
  async getSettings(userId: string): Promise<Settings | undefined> {
    const [result] = await db.select().from(settings).where(eq(settings.userId, userId));
    return result;
  }

  async updateSettings(userId: string, data: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings(userId);
    if (existing) {
      const [updated] = await db.update(settings).set({ ...data, updatedAt: new Date() }).where(eq(settings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values({ ...data, userId } as any).returning();
      return created;
    }
  }

  // Pricing & Bundling
  async getTieredPricing(productId: number): Promise<TieredPricing[]> {
    return await db.select().from(tieredPricing).where(eq(tieredPricing.productId, productId)).orderBy(tieredPricing.minQuantity);
  }

  async createTieredPricing(data: InsertTieredPricing): Promise<TieredPricing> {
    const [result] = await db.insert(tieredPricing).values(data).returning();
    return result;
  }

  async deleteTieredPricing(id: number): Promise<void> {
    await db.delete(tieredPricing).where(eq(tieredPricing.id, id));
  }

  async getProductBundles(parentProductId: number): Promise<ProductBundle[]> {
    return await db.select().from(productBundles).where(eq(productBundles.parentProductId, parentProductId));
  }

  async createProductBundle(data: InsertProductBundle): Promise<ProductBundle> {
    const [result] = await db.insert(productBundles).values(data).returning();
    return result;
  }

  async deleteProductBundle(id: number): Promise<void> {
    await db.delete(productBundles).where(eq(productBundles.id, id));
  }

  // === Categories & Units ===
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(desc(categories.createdAt));
  }

  async createCategory(data: InsertCategory & { userId: string }): Promise<Category> {
    const [result] = await db.insert(categories).values(data).returning();
    return result;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category> {
    const [result] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return result;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getUnits(userId: string): Promise<Unit[]> {
    return await db.select().from(units).where(eq(units.userId, userId)).orderBy(desc(units.createdAt));
  }

  async createUnit(data: InsertUnit & { userId: string }): Promise<Unit> {
    const [result] = await db.insert(units).values(data).returning();
    return result;
  }

  async updateUnit(id: number, updates: Partial<InsertUnit>): Promise<Unit> {
    const [result] = await db.update(units).set(updates).where(eq(units.id, id)).returning();
    return result;
  }

  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }
}

export const storage = new DatabaseStorage();
