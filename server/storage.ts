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
  categories, units, activityLogs, auditLogs, inventoryLots, customerLoyaltyLedger, otpCodes,
  appointments, restaurantTables, orderStatusLogs, productModifiers,

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
  type ActivityLog, type InsertActivityLog,
  type AuditLog, type InsertAuditLog,
  stockTransfers, stockTransferItems,
  type StockTransfer, type InsertStockTransfer,
  type StockTransferItem, type InsertStockTransferItem,
  type CustomerLoyaltyLedger, type InsertCustomerLoyaltyLedger,
} from "@shared/schema";
import { eq, desc, and, inArray, gt, lt, ne } from "drizzle-orm";

export interface IStorage {
  getProducts(userId: string, locationType?: string, branchId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  bulkDeleteProducts(ids: number[], userId: string): Promise<number>;
  bulkResetStock(ids: number[], userId: string): Promise<void>;
  getProductsWithPhotosAndUnits(userId: string): Promise<ProductWithPhotosAndUnits[]>;

  getProductPhotos(productId: number): Promise<ProductPhoto[]>;
  addProductPhoto(data: InsertProductPhoto): Promise<ProductPhoto>;
  deleteProductPhoto(id: number): Promise<void>;

  getProductUnits(productId: number): Promise<ProductUnit[]>;
  addProductUnit(data: InsertProductUnit): Promise<ProductUnit>;
  updateProductUnit(id: number, data: Partial<InsertProductUnit>): Promise<ProductUnit>;
  deleteProductUnit(id: number): Promise<void>;

  getSessions(userId: string, locationType?: string, branchId?: number): Promise<OpnameSession[]>;
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
 // Adding just in case for older schema

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
  deductFifoStockAndGetCogs(productId: number, quantity: number, branchId?: number): Promise<number>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems>;
  updateInvoiceStatus(id: number, userId: string, status: string): Promise<void>;
  voidSale(id: number, userId: string, reason?: string): Promise<Sale>;
  autoJournalSale(saleId: number, userId: string, totalAmount: number, totalCogs: number, type: string, taxAmount?: number, branchId?: number): Promise<void>;
  autoJournalVoid(saleId: number, userId: string, totalAmount: number, totalCogs: number, type: string, taxAmount?: number, branchId?: number): Promise<void>;

  // Promotions
  getPromotions(userId: string): Promise<Promotion[]>;
  createPromotion(promo: InsertPromotion): Promise<Promotion>;
  deletePromotion(id: number): Promise<void>;
  getActivePromotions(userId: string): Promise<Promotion[]>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  getCustomers(userId: string): Promise<Customer[]>;
  getCustomersWithStats(userId: string): Promise<(Customer & { totalSpent: number; totalOrders: number; lastOrderDate: Date | null })[]>;
  getCustomerLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyLedger[]>;
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

  // === Purchase Orders & Suppliers ===
  getSuppliers(userId: string): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier>;
  
  getPurchaseOrders(userId: string): Promise<any[]>;
  createPurchaseOrder(po: any, items: any[]): Promise<any>;
  completePurchaseOrder(id: number): Promise<any>;

  // === RMA & Sales Returns ===
  createSalesReturn(userId: string, returnData: any, items: any[]): Promise<any>;
  getSalesReturns(userId: string): Promise<any[]>;

  // === Business Verticals (Laundry, Restaurants, Barbershop) ===
  getAppointments(userId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  getRestaurantTables(userId: string): Promise<RestaurantTable[]>;
  createRestaurantTable(table: InsertRestaurantTable): Promise<RestaurantTable>;
  updateRestaurantTable(id: number, data: Partial<InsertRestaurantTable>): Promise<RestaurantTable>;
  deleteRestaurantTable(id: number): Promise<void>;

  getOrderStatusLogs(orderId: string): Promise<OrderStatusLog[]>;
  createOrderStatusLog(log: InsertOrderStatusLog): Promise<OrderStatusLog>;

  getProductModifiers(productId: number): Promise<ProductModifier[]>;
  createProductModifier(modifier: InsertProductModifier): Promise<ProductModifier>;
  deleteProductModifier(id: number): Promise<void>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // === Stock Transfers ===
  getStockTransfers(userId: string): Promise<any[]>;
  getStockTransfer(id: number): Promise<any | undefined>;
  createStockTransfer(userId: string, transfer: InsertStockTransfer, items: InsertStockTransferItem[]): Promise<any>;
  completeStockTransfer(id: number, receivedBy: string): Promise<any>;

  // Integrity Helpers
  checkStockIntegrity(userId: string): Promise<{ productId: number; sku: string; currentStock: number; lotStock: number; diff: number }[]>;

  // === Phase 19: Analytics ===
  getStockHealth(userId: string): Promise<{ totalItems: number; outOfStock: number; lowStock: number; healthy: number }>;
  getTopSellingItems(userId: string, limit?: number): Promise<{ productId: number; name: string; totalQuantity: number; totalRevenue: number }[]>;
  getCategoryPerformance(userId: string): Promise<{ category: string; totalItems: number; totalStock: number; totalValue: number; totalSales: number }[]>;

  // === Phase 20: Advanced Analytics & Demand Forecasting ===
  getInventoryDemand(userId: string): Promise<any[]>;
  getSalesForecast(userId: string): Promise<any>;
  getInventoryAging(userId: string): Promise<any>;

  // === Phase 22: SaaS Console Backend ===
  getSaaSMetrics(adminId: string): Promise<any>;
  getModuleSubscriptions(userId: string): Promise<any[]>;
  getSaaSActivityLogs(adminId: string): Promise<any[]>;

  // === Phase 23: Report Hub Backend ===
  getSalesSummary(userId: string, startDate?: Date, endDate?: Date): Promise<any>;
  getSalesItemsReport(userId: string, sortBy?: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getStockLedger(userId: string, productId?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(userId: string, locationType?: string, branchId?: number): Promise<Product[]> {
    const { eq, and, sql } = await import("drizzle-orm");

    if (branchId) {
      // Hitung stok per cabang secara dinamis dari LOT yang tersisa di cabang tersebut
      const results = await db.select({
        product: products,
        branchStock: sql<number>`CAST(COALESCE(SUM(${inventoryLots.remainingQuantity}), 0) AS FLOAT)`
      })
      .from(products)
      .leftJoin(inventoryLots, and(
        eq(inventoryLots.productId, products.id),
        eq(inventoryLots.branchId, branchId)
      ))
      .where(eq(products.userId, userId))
      .groupBy(products.id)
      .orderBy(products.sku);

      return results.map(r => ({
        ...r.product,
        currentStock: Number(r.branchStock)
      }));
    }

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
    
    await this.createActivityLog({
      action: "CREATE",
      entityType: "product",
      entityId: product.id,
      userId: insertProduct.userId,
      details: { sku: product.sku, name: product.name }
    });

    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    
    await this.createActivityLog({
      action: "UPDATE",
      entityType: "product",
      entityId: product.id,
      userId: product.userId,
      details: { updates: Object.keys(updates) }
    });

    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProduct(id);
    if (product) {
      await this.createActivityLog({
        action: "DELETE",
        entityType: "product",
        entityId: id,
        userId: product.userId,
        details: { sku: product.sku, name: product.name }
      });
      await db.delete(products).where(eq(products.id, id));
    }
  }
  
  async bulkDeleteProducts(ids: number[], userId: string): Promise<number> {
    const result = await db.delete(products)
      .where(and(inArray(products.id, ids), eq(products.userId, userId)))
      .returning();
    
    if (result.length > 0) {
      await this.createAuditLog({
        action: "BULK_DELETE_PRODUCTS",
        entityType: "product",
        entityId: 0,
        userId: userId,
        details: { count: result.length, ids }
      });
    }

    return result.length;
  }

  async bulkResetStock(ids: number[], userId: string): Promise<void> {
    await db.update(products)
      .set({ currentStock: 0 })
      .where(and(inArray(products.id, ids), eq(products.userId, userId)));
    
    // Konsistensi: Reset juga inventory_lots agar stock lot jadi 0
    await db.update(inventoryLots)
      .set({ remainingQuantity: 0 })
      .where(inArray(inventoryLots.productId, ids));

    await this.createAuditLog({
      action: "BULK_RESET_STOCK",
      entityType: "product",
      entityId: 0,
      userId: userId,
      details: { count: ids.length, ids }
    });
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

  async getSessions(userId: string, locationType?: string, branchId?: number): Promise<OpnameSession[]> {
    const conditions = [eq(opnameSessions.userId, userId)];
    
    if (locationType) {
      conditions.push(eq(opnameSessions.locationType, locationType as "toko" | "gudang"));
    }
    
    if (branchId !== undefined) {
      conditions.push(eq(opnameSessions.branchId, branchId));
    }
    
    return await db.select().from(opnameSessions)
      .where(and(...conditions))
      .orderBy(desc(opnameSessions.startedAt));
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
    const { eq, sql } = await import("drizzle-orm");

    return await db.transaction(async (tx) => {
      const [session] = await tx.select().from(opnameSessions).where(eq(opnameSessions.id, id));
      if (!session) throw new Error("Session not found");

      const records = await tx.select().from(opnameRecords).where(eq(opnameRecords.sessionId, id));
      const adjustments: { type: "shrinkage" | "surplus", amount: number, productName: string, branchId?: number }[] = [];

      for (const record of records) {
        if (record.actualStock === null) continue;

        const [product] = await tx.select().from(products).where(eq(products.id, record.productId));
        if (!product) continue;

        const systemStock = product.currentStock;
        const physicalStock = record.actualStock;
        const diff = physicalStock - systemStock;

        if (diff < 0) {
          // Shrinkage (Stok Fisik < Stok Sistem)
          const lossQuantity = Math.abs(diff);
          const totalLossCost = await this.deductFifoStockAndGetCogs(product.id, lossQuantity, session.branchId || undefined, tx);
          
          adjustments.push({
            type: "shrinkage",
            amount: totalLossCost,
            productName: product.name,
            branchId: session.branchId || undefined
          });

          // Log stock movement for ledger
          await this.createActivityLog({
            userId: session.userId,
            branchId: session.branchId || undefined,
            entityType: "product",
            entityId: product.id,
            action: "STOCK_OUT",
            details: { type: "opname_shrinkage", reference: session.title, quantity: lossQuantity }
          }, tx);

        } else if (diff > 0) {
          // Surplus (Stok Fisik > Stok Sistem)
          const surplusQuantity = diff;
          const purchasePrice = product.unitCost ? Number(product.unitCost) : 0;
          
          await tx.insert(inventoryLots).values({
            productId: product.id,
            branchId: session.branchId,
            purchasePrice: purchasePrice.toString(),
            initialQuantity: surplusQuantity,
            remainingQuantity: surplusQuantity,
            inboundDate: new Date(),
          });

          adjustments.push({
            type: "surplus",
            amount: surplusQuantity * purchasePrice,
            productName: product.name,
            branchId: session.branchId || undefined
          });

          // Log stock movement for ledger
          await this.createActivityLog({
            userId: session.userId,
            branchId: session.branchId || undefined,
            entityType: "product",
            entityId: product.id,
            action: "STOCK_IN",
            details: { type: "opname_surplus", reference: session.title, quantity: surplusQuantity }
          }, tx);
        }

        // Update Product Current Stock
        await tx.update(products)
          .set({ currentStock: physicalStock })
          .where(eq(products.id, product.id));
      }

      // Process Journal Entries (Branch-Aware)
      if (adjustments.length > 0) {
        // Since autoJournalStockAdjustment uses its own internal calls, we should ensure it can handle tx context if needed
        // but for now it creates internal entries which is fine if atomic
        await this.autoJournalStockAdjustment(id, session.userId, adjustments);
      }

      // Finalize Session
      const [updatedSession] = await tx.update(opnameSessions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(opnameSessions.id, id))
        .returning();

      // Log Activity
      await this.createActivityLog({
        userId: session.userId,
        branchId: session.branchId,
        action: "COMPLETE_OPNAME",
        details: `Diselesaikan: ${session.title}. Penyesuaian: ${adjustments.length} item.`
      }, tx);

      return updatedSession;
    });
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
    
    await db.transaction(async (tx) => {
      for (const item of items) {
        const product = await this.getProduct(item.productId);
        if (product) {
          const currentQty = product.currentStock || 0;
          const currentUnitCost = Number(product.unitCost || 0);
          const inboundQty = item.quantityReceived;
          const inboundUnitCost = (item as any).unitCost ? Number((item as any).unitCost) : 0;

          // WAC Formula: ((OldQty * OldCost) + (NewQty * NewCost)) / (OldQty + NewQty)
          const newTotalStock = currentQty + inboundQty;
          const newUnitCost = newTotalStock > 0 
              ? ((currentQty * currentUnitCost) + (inboundQty * inboundUnitCost)) / newTotalStock
              : inboundUnitCost;

          await tx.update(products)
            .set({ 
              currentStock: newTotalStock,
              unitCost: newUnitCost.toString()
            })
            .where(eq(products.id, item.productId));

          // FIFO: Catat lot baru untuk barang masuk dengan referensi cabang
          await tx.insert(inventoryLots).values({
            productId: item.productId,
            branchId: session.branchId,
            purchasePrice: inboundUnitCost.toString(),
            initialQuantity: inboundQty,
            remainingQuantity: inboundQty,
            inboundDate: new Date(),
            inboundSessionId: session.id,
            expiryDate: item.expiryDate
          });
        }
      }
    });

    // 5. Automated Journal Entry (Inventory / Payable)
    await this.createAccountingEntriesForInbound(id);

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
    const { eq } = await import("drizzle-orm");

    const [session] = await db.select().from(outboundSessions).where(eq(outboundSessions.id, id));
    if (!session) throw new Error("Outbound session not found");

    const items = await db.select().from(outboundItems).where(eq(outboundItems.sessionId, id));
    let totalOutboundCogs = 0;

    // Update stock levels using FIFO within the specific branch
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        // Step 1: Deduct from LOTS using FIFO from the SOURCE BRANCH
        const itemCogs = await this.deductFifoStockAndGetCogs(product.id, item.quantityShipped, session.fromBranchId || undefined);
        totalOutboundCogs += itemCogs;

        // Step 2: Update Product Current Stock (Global Cache)
        const newStock = Math.max(0, product.currentStock - item.quantityShipped);
        await db.update(products)
          .set({ currentStock: newStock })
          .where(eq(products.id, item.productId));
      }
    }

    // Step 3: Accounting Journal (Branch-Aware)
    if (totalOutboundCogs > 0) {
      await this.ensureDefaultAccounts(session.userId);
      const accountsList = await this.getAccounts(session.userId);
      const findAcc = (code: string) => accountsList.find(a => a.code === code);
      
      const invAcc = findAcc("1201");
      const outAcc = session.toBranchId ? findAcc("1201") : findAcc("5101"); 
      
      if (invAcc && outAcc) {
        await this.createJournalEntry(
          { 
            description: `Outbound #${id} (${session.toBranchId ? "Mutasi" : "Pengeluaran"}): ${session.title}`, 
            reference: `OUT-${id}`, 
            userId: session.userId, 
            date: new Date() 
          },
          [
            // Credit from Origin (Decrease Asset)
            { accountId: invAcc.id, debit: 0, credit: totalOutboundCogs, userId: session.userId, branchId: session.fromBranchId },
            // Debit to Destination or Expense (Increase Asset or Cost)
            { accountId: outAcc.id, debit: totalOutboundCogs, credit: 0, userId: session.userId, branchId: session.toBranchId || session.fromBranchId },
          ]
        );
      }
    }

    // Auto-create Inbound session for the destination if it's a transfer
    if (session.toBranchId) {
      const [inboundSession] = await db.insert(inboundSessions).values([{
        title: `Kiriman Masuk: ${session.title}`,
        userId: session.userId,
        branchId: session.toBranchId, // Masuk ke cabang tujuan
        status: "in_progress",
        notes: `Otomatis dari Outbound #${session.id} (Cabang Asal: ${session.fromBranchId ?? "Gudang Utama"}).`,
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

    // Mark as shipped
    const [updatedSession] = await db.update(outboundSessions)
      .set({ status: "shipped", shippedAt: new Date() })
      .where(eq(outboundSessions.id, id))
      .returning();

    // Log Activity
    await this.createActivityLog({
      userId: session.userId,
      branchId: session.fromBranchId,
      action: "COMPLETE_OUTBOUND",
      details: `Outbound Selesai: ${session.title}. Tujuan: ${session.toBranchId ?? "Internal"}. Nilai: Rp${totalOutboundCogs.toLocaleString("id-ID")}`
    });

    return updatedSession;
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
            items: {
              with: {
                product: true
              }
            }
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
    const { eq } = await import("drizzle-orm");

    const [session] = await db.select().from(assemblySessions).where(eq(assemblySessions.id, id));
    if (!session) throw new Error("Assembly session not found");

    const bom = await this.getBOM(session.bomId);
    if (!bom) throw new Error("BOM not found");

    let totalMaterialCogs = 0;

    // 1. Deduct Materials using FIFO from the specific branch
    for (const item of bom.items) {
      const neededQty = Number(item.quantityNeeded) * Number(session.quantityProduced);
      const materialCogs = await this.deductFifoStockAndGetCogs(item.productId, neededQty, session.branchId || undefined);
      totalMaterialCogs += materialCogs;

      // Update global stock count
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        await db.update(products)
          .set({ currentStock: Math.max(0, product.currentStock - neededQty) })
          .where(eq(products.id, item.productId));
      }
    }

    // 2. Calculate Final HPP (Materials + Labor + Overhead)
    const labor = Number(session.laborCost || 0);
    const overhead = Number(session.overheadCost || 0);
    const totalProductionCost = totalMaterialCogs + labor + overhead;
    const hppPerUnit = totalProductionCost / Number(session.quantityProduced);

    // 3. Create Inventory Lot for the Finished Good in the target branch
    const [targetProduct] = await db.select().from(products).where(eq(products.id, bom.targetProductId));
    if (targetProduct) {
      await db.insert(inventoryLots).values({
        productId: targetProduct.id,
        branchId: session.branchId,
        purchasePrice: hppPerUnit.toString(),
        initialQuantity: Number(session.quantityProduced),
        remainingQuantity: Number(session.quantityProduced),
        inboundDate: new Date(),
        notes: `Produksi BOM #${bom.id}: ${bom.name}`
      } as any);

      // Update global stock
      await db.update(products)
        .set({ currentStock: (targetProduct.currentStock || 0) + Number(session.quantityProduced) })
        .where(eq(products.id, targetProduct.id));
    }

    // 4. Automated Journal Entry (Inventory WIP/FG)
    await this.ensureDefaultAccounts(session.userId);
    const accountsList = await this.getAccounts(session.userId);
    const findAcc = (code: string) => accountsList.find(a => a.code === code);

    const fgAcc = findAcc("1201"); // Finished Goods
    const rmAcc = findAcc("1201"); // Raw Materials (Assuming same inventory account for now, but branchId keeps them distinct)
    const allocAcc = findAcc("2103"); // Allocation account for labor/overhead

    if (fgAcc && rmAcc) {
      const journalItems = [
        { accountId: fgAcc.id, debit: totalProductionCost, credit: 0, userId: session.userId, branchId: session.branchId },
        { accountId: rmAcc.id, debit: 0, credit: totalMaterialCogs, userId: session.userId, branchId: session.branchId },
      ];

      if ((labor + overhead) > 0 && allocAcc) {
        journalItems.push({ 
           accountId: allocAcc.id, 
           debit: 0, 
           credit: labor + overhead, 
           userId: session.userId, 
           branchId: session.branchId 
        });
      }

      await this.createJournalEntry(
        { 
          description: `Produksi Produk Jadi: ${targetProduct?.name || "Unknown"} x ${session.quantityProduced}`, 
          reference: `ASM-${session.id}`, 
          userId: session.userId, 
          date: new Date() 
        },
        journalItems
      );
    }

    const [updated] = await db.update(assemblySessions)
      .set({ status: "completed" })
      .where(eq(assemblySessions.id, id))
      .returning();
    
    // Log Activity
    await this.createActivityLog({
      userId: session.userId,
      branchId: session.branchId,
      action: "COMPLETE_PRODUCTION",
      details: `Selesai Produksi: ${targetProduct?.name}. Qty: ${session.quantityProduced}. Total HPP: Rp${totalProductionCost.toLocaleString("id-ID")}`
    });

    return updated;
  }

  // === POS & Sales ===
  async getSales(userId: string, branchId?: number): Promise<SaleWithItems[]> {
    const { eq, and } = await import("drizzle-orm");
    const whereClause = branchId 
      ? and(eq(sales.userId, userId), eq(sales.branchId, branchId))
      : eq(sales.userId, userId);

    const result = await db.query.sales.findMany({
      where: whereClause,
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

  async getSale(id: number, txContext?: any): Promise<SaleWithItems | undefined> {
    const executor = txContext || db;
    const [sale] = await executor.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const items = await executor.select().from(saleItems)
      .where(eq(saleItems.saleId, id))
      .leftJoin(products, eq(saleItems.productId, products.id));

    const [customer] = sale.customerId
      ? await executor.select().from(customers).where(eq(customers.id, sale.customerId))
      : [null];

    const [salesperson] = sale.salespersonId
      ? await executor.select().from(users).where(eq(users.id, sale.salespersonId))
      : [null];

    return {
      ...sale,
      customer,
      salespersonName: salesperson ? `${salesperson.firstName} ${salesperson.lastName}`.trim() : "Staff",
      items: items.map(i => ({ ...i.sale_items, product: i.products! }))
    } as unknown as SaleWithItems;
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems> {
    console.log(">>> [storage.createSale] FUNCTION ENTERED");
    try {
      return await db.transaction(async (tx) => {
      let saleData = { ...sale };
      const pointsToRedeem = sale.pointsRedeemed || 0;
      const pointsValue = pointsToRedeem; // 1 Poin = Rp 1 (confirmed by user)

      if (sale.type === "erp_invoice" && !sale.invoiceNumber) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const count = await tx.select().from(sales).where(eq(sales.userId, sale.userId));
        saleData.invoiceNumber = `INV-${dateStr}-${(count.length + 1).toString().padStart(4, "0")}`;
      }

      if (sale.type === "pos" && !sale.sessionId) {
        const activeSession = await this.getActivePOSSession(sale.userId);
        if (activeSession) {
          saleData.sessionId = activeSession.id;
        }
      }

      // Security: Validate Voucher
      if (sale.voucherId) {
        const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, sale.voucherId));
        if (!voucher || voucher.active === 0 || voucher.usedCount >= voucher.maxUses) {
          throw new Error("Voucher tidak valid atau sudah melampaui batas penggunaan");
        }
        const newUsedCount = voucher.usedCount + 1;
        await tx.update(vouchers)
          .set({ 
             usedCount: newUsedCount, 
             active: newUsedCount >= voucher.maxUses ? 0 : 1 
          })
          .where(eq(vouchers.id, voucher.id));
      }

      const productIds = items.map(i => i.productId);
      
      // Fetch related data for validation
      const allTieredPrices = await tx.select().from(tieredPricing).where(inArray(tieredPricing.productId, productIds));
      const allPromos = await tx.select().from(promotions).where(and(inArray(promotions.productId, productIds), eq(promotions.active, 1)));

      let calculatedSubtotal = 0;
      let totalSaleCogs = 0;
      const validatedItems = [];

      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error("Kuantitas produk tidak boleh kurang dari atau sama dengan nol.");
        }

        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);

        let basePrice = Number(product.sellingPrice || 0);
        
        // 1. Re-calculate Tiered Pricing (Bulk Discount)
        const relevantTiers = allTieredPrices
            .filter(t => t.productId === item.productId)
            .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity));
        
        const activeTier = relevantTiers.find(t => item.quantity >= Number(t.minQuantity));
        if (activeTier) {
            basePrice = Number(activeTier.price);
        }

        // 2. Re-calculate Promotion
        let calculatedItemDiscount = 0;
        const promo = allPromos.find(p => p.productId === item.productId);
        if (promo) {
            // Basic time validation (optional but better)
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentDay = now.getDay().toString();
            
            let isPromoActive = true;
            if (promo.startTime && promo.endTime) {
                if (currentTime < promo.startTime || currentTime > promo.endTime) isPromoActive = false;
            }
            if (promo.daysOfWeek && !promo.daysOfWeek.split(',').includes(currentDay)) {
                isPromoActive = false;
            }

            if (isPromoActive) {
                if (promo.type === 'percentage') {
                    calculatedItemDiscount = basePrice * (Number(promo.value) / 100);
                } else {
                    calculatedItemDiscount = Number(promo.value);
                }
            }
        }

        // Security: Force server-calculated values
        const itemDiscount = calculatedItemDiscount;
        const subtotal = (item.quantity * basePrice) - itemDiscount;

        if (subtotal < 0) {
            throw new Error(`Diskon pada produk ${product.name} melebihi harga jual.`);
        }

        calculatedSubtotal += subtotal;

        await tx.update(products).set({
          currentStock: (product.currentStock || 0) - item.quantity
        }).where(eq(products.id, item.productId));

        // Atomic FIFO Cogs derivation
        const exactCogs = await this.deductFifoStockAndGetCogs(product.id, item.quantity, sale.branchId || undefined, tx);
        totalSaleCogs += exactCogs;

        // === Phase 12: Product Bundling (Deduct Child Stock) ===
        const bundles = await tx.select().from(productBundles).where(eq(productBundles.parentProductId, item.productId));
        for (const bundle of bundles) {
            const childQty = Number(bundle.quantity) * item.quantity;
            const [childProd] = await tx.select().from(products).where(eq(products.id, bundle.childProductId));
            if (childProd) {
                await tx.update(products).set({
                    currentStock: (childProd.currentStock || 0) - childQty
                }).where(eq(products.id, childProd.id));
                await this.deductFifoStockAndGetCogs(childProd.id, childQty, sale.branchId || undefined, tx);
            }
        }

        validatedItems.push({
          ...item,
          unitPrice: basePrice.toString(), 
          subtotal: subtotal.toString(),
          discountAmount: itemDiscount.toString(),
          cogs: exactCogs,
        });
      }

      const finalTax = Number(sale.taxAmount || 0);
      let finalDiscount = 0;
      // Recalculate Voucher Discount
      if (sale.voucherId) {
        const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, sale.voucherId));
        if (voucher && voucher.active === 1 && voucher.usedCount < voucher.maxUses) {
            if (calculatedSubtotal >= Number(voucher.minPurchase)) {
                if (voucher.type === 'percentage') {
                    finalDiscount = calculatedSubtotal * (Number(voucher.value) / 100);
                } else {
                    finalDiscount = Number(voucher.value);
                }
            }
        }
      }

      let finalGrandTotal = calculatedSubtotal + finalTax - finalDiscount;

      // === Phase 17: Customer Loyalty Redemption ===
      if (pointsToRedeem > 0) {
        if (!sale.customerId) {
          throw new Error("Pelanggan harus dipilih untuk menukarkan poin.");
        }
        const [customer] = await tx.select().from(customers).where(eq(customers.id, sale.customerId));
        if (!customer || (customer.points || 0) < pointsToRedeem) {
          throw new Error(`Saldo poin tidak mencukupi. Saldo saat ini: ${customer?.points || 0}`);
        }
        
        finalGrandTotal -= pointsValue;
        saleData.pointsValueRedeemed = pointsValue.toString();
      }

      if (finalGrandTotal < 0) {
        finalGrandTotal = 0; 
      }

      saleData.totalAmount = finalGrandTotal;
      saleData.discountAmount = finalDiscount; 

      console.log(">>> [createSale] STEP 6: PRE-INSERT AUDIT", {
        totalAmount: saleData.totalAmount,
        discountAmount: saleData.discountAmount,
        pointsValueRedeemed: saleData.pointsValueRedeemed
      });

      const [newSale] = await tx.insert(sales).values(saleData).returning();
      console.log(">>> [createSale] STEP 7: INSERT SALE SUCCESS ID:", newSale.id);

      for (const vItem of validatedItems) {
        console.log(">>> [createSale] STEP 8: INSERTING ITEM FOR PRODUCT:", vItem.productId);
        await tx.insert(saleItems).values({
          ...vItem,
          saleId: newSale.id,
          unitPrice: Number(vItem.unitPrice),
          subtotal: Number(vItem.subtotal),
          discountAmount: Number(vItem.discountAmount || 0),
          appliedPromotionId: vItem.appliedPromotionId || null
        });

          // Log stock movement for ledger
          await this.createActivityLog({
            userId: sale.userId,
            branchId: newSale.branchId || undefined,
            entityType: "product",
            entityId: vItem.productId,
            action: "STOCK_OUT",
            details: { 
              type: "sale", 
              reference: newSale.invoiceNumber, 
              quantity: vItem.quantity,
              unitPrice: vItem.unitPrice
            }
          }, tx);
        }

        // Record Sales and Cogs into Journal via atomic txContext
        await this.autoJournalSale(
          newSale.id, 
          sale.userId, 
          finalGrandTotal, 
          totalSaleCogs, 
          sale.type || "pos", 
          finalTax,
          newSale.branchId || undefined,
          tx
        );

      // Add Activity Log for the sale
      await this.createActivityLog({
          userId: sale.userId,
          action: "CREATE_SALE",
          entityType: "sale",
          entityId: newSale.id,
          details: { 
            invoice: newSale.invoiceNumber, 
            total: finalGrandTotal, 
            type: sale.type || "pos",
            pointsRedeemed: pointsToRedeem 
          }
      });

      if (newSale.customerId) {
          const earnedPoints = Math.floor(Number(newSale.totalAmount) / 1000);
          const customer = await tx.select().from(customers).where(eq(customers.id, newSale.customerId)).then(res => res[0]);
          
          if (customer) {
              let netPointsDelta = earnedPoints - pointsToRedeem;
              const newPointsBalance = Math.max(0, (customer.points || 0) + netPointsDelta);

              await tx.update(customers)
                .set({ points: newPointsBalance })
                .where(eq(customers.id, customer.id));
              
              // Formal Ledger Logging
              if (pointsToRedeem > 0) {
                await tx.insert(customerLoyaltyLedger).values({
                  customerId: customer.id,
                  pointsDelta: -pointsToRedeem,
                  action: "spent",
                  saleId: newSale.id,
                  note: `Penukaran poin untuk transaksi #${newSale.uuid.slice(0, 8)}`,
                  userId: sale.userId
                });
              }

              if (earnedPoints > 0) {
                await tx.insert(customerLoyaltyLedger).values({
                  customerId: customer.id,
                  pointsDelta: earnedPoints,
                  action: "earned",
                  saleId: newSale.id,
                  note: `Poin didapat dari transaksi #${newSale.uuid.slice(0, 8)}`,
                  userId: sale.userId
                });
              }

              await tx.insert(auditLogs).values({
                  action: pointsToRedeem > 0 ? "LOYALTY_POINTS_REDEEMED" : "LOYALTY_POINTS_EARNED",
                  entityType: "customer",
                  entityId: customer.id,
                  userId: sale.userId,
                  details: { 
                    saleId: newSale.id, 
                    pointsEarned: earnedPoints, 
                    pointsSpent: pointsToRedeem,
                    newBalance: newPointsBalance 
                  }
              });
          }
      }

      const finalSale = await this.getSale(newSale.id, tx);
      console.log(">>> [storage.createSale] SUCCESS, RETURNING SALE ID:", finalSale?.id);
      return finalSale!;
    });
    } catch (err: any) {
      console.error(">>> [storage.createSale] FATAL ERROR:", err.message);
      console.error(">>> [storage.createSale] STACK:", err.stack);
      throw err;
    }
  }

  async voidSale(id: number, userId: string, reason?: string): Promise<Sale> {
    return await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
      if (!sale) throw new Error("Sale not found");
      if (sale.paymentStatus === "voided") throw new Error("Sale is already voided");

      // 1. Update sale status
      const [updatedSale] = await tx.update(sales)
        .set({
          paymentStatus: "voided",
          voidedAt: new Date(),
          voidedBy: userId
        })
        .where(eq(sales.id, id))
        .returning();

      // 2. Restore stock
      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, id));
      let totalSaleCogs = 0;

      for (const item of items) {
        const parsedCogs = Number(item.cogs || 0);
        totalSaleCogs += parsedCogs;

        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          // This is a manual update logic without `updateProduct` hook to ensure atomic execution
          await tx.update(products).set({
            currentStock: (product.currentStock || 0) + Number(item.quantity)
          }).where(eq(products.id, product.id));
        }

        // Restore FIFO Stock into inventory_lots (Branch-Aware)
        const averageCostPerUnit = Number(item.quantity) > 0 ? parsedCogs / Number(item.quantity) : 0;
        await tx.insert(inventoryLots).values({
           productId: item.productId,
           branchId: sale.branchId, // Restore ke cabang asal penjualan
           purchasePrice: averageCostPerUnit.toString(),
           initialQuantity: Number(item.quantity),
           remainingQuantity: Number(item.quantity),
           inboundDate: new Date(),
        } as any);

        // Log stock movement for ledger (Restoration)
        await this.createActivityLog({
          userId: userId,
          branchId: sale.branchId || undefined,
          entityType: "product",
          entityId: item.productId,
          action: "STOCK_IN",
          details: { 
            type: "void_restore", 
            reference: sale.invoiceNumber, 
            quantity: item.quantity 
          }
        }, tx);
      }

      // 3. Reverse CRM Loyalty Points
      if (sale.customerId) {
        const earnedPoints = Math.floor(Number(sale.totalAmount) / 1000);
        const pointsToRedeem = sale.pointsRedeemed || 0;
        
        const [customer] = await tx.select().from(customers).where(eq(customers.id, sale.customerId));
        
        if (customer) {
          // If they earned points, we must deduct them back.
          // If they spent points, we must refund them back.
          let netPointsDelta = pointsToRedeem - earnedPoints; 
          const newPointsBalance = Math.max(0, (customer.points || 0) + netPointsDelta);

          await tx.update(customers)
            .set({ points: newPointsBalance })
            .where(eq(customers.id, customer.id));

          if (earnedPoints > 0) {
            await tx.insert(customerLoyaltyLedger).values({
              customerId: customer.id,
              pointsDelta: -earnedPoints,
              action: "spent",
              saleId: sale.id,
              note: `Penarikan poin akibat Void Transaksi #${sale.invoiceNumber || sale.id}`,
              userId: userId
            } as any);
          }

          if (pointsToRedeem > 0) {
            await tx.insert(customerLoyaltyLedger).values({
              customerId: customer.id,
              pointsDelta: pointsToRedeem,
              action: "earned",
              saleId: sale.id,
              note: `Pengembalian poin akibat Void Transaksi #${sale.invoiceNumber || sale.id}`,
              userId: userId
            } as any);
          }

          await tx.insert(auditLogs).values({
            action: "LOYALTY_POINTS_REVERSED",
            entityType: "customer",
            entityId: customer.id,
            userId: userId,
            details: { 
              saleId: sale.id, 
              pointsRefunded: pointsToRedeem, 
              pointsDeducted: earnedPoints,
              newBalance: newPointsBalance 
            }
          });
        }
      }



      // 3. Reverse accounting entries (Journal Entry Reversal) passing EXACT totalSaleCogs and tx
      await this.autoJournalVoid(
          id, 
          userId, 
          parseFloat(sale.totalAmount.toString()), 
          totalSaleCogs, 
          sale.type || "pos", 
          parseFloat(sale.taxAmount?.toString() || "0"),
          sale.branchId || undefined,
          tx
      );

      // 4. Record Audit Log anti-fraud
      await tx.insert(auditLogs).values({
        action: "VOID_SALE",
        entityType: "sale",
        entityId: id,
        userId: userId,
        details: {
          reason: reason || "Tanpa alasan",
          voidedAmount: parseFloat(sale.totalAmount.toString()),
          cogsReversed: totalSaleCogs,
        }
      });

      // 5. Phase 17: Customer Loyalty Engine (Reversal)
      if (sale.customerId) {
          const earnedPoints = Math.floor(parseFloat(sale.totalAmount.toString()) / 1000);
          const redeemedPoints = sale.pointsRedeemed || 0;
          const netPointsToRevert = redeemedPoints - earnedPoints;

          const customer = await tx.select().from(customers).where(eq(customers.id, sale.customerId)).then(res => res[0]);
          if (customer) {
              const newPoints = Math.max(0, (customer.points || 0) + netPointsToRevert);
              await tx.update(customers)
                .set({ points: newPoints })
                .where(eq(customers.id, customer.id));
              
              await tx.insert(customerLoyaltyLedger).values({
                  customerId: customer.id,
                  pointsDelta: netPointsToRevert,
                  action: "voided",
                  saleId: id,
                  note: `Pembalikan poin dari pembatalan transaksi #${sale.uuid.slice(0, 8)}`,
                  userId
              });

              await tx.insert(auditLogs).values({
                  action: "LOYALTY_POINTS_VOIDED",
                  entityType: "customer",
                  entityId: customer.id,
                  userId,
                  details: { 
                    saleId: sale.id, 
                    pointsReverted: netPointsToRevert, 
                    earnedPointsReversed: earnedPoints,
                    redeemedPointsRestored: redeemedPoints,
                    newBalance: newPoints 
                  }
              });
          }
      }

      return updatedSale;
    });
  }

  async getCustomerLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyLedger[]> {
    return await db.select()
      .from(customerLoyaltyLedger)
      .where(eq(customerLoyaltyLedger.customerId, customerId))
      .orderBy(desc(customerLoyaltyLedger.createdAt));
  }

  // === Phase 11: Purchase Orders (Procurement) ===
  async getSuppliers(userId: string): Promise<Supplier[]> {
    const { suppliers } = await import("@shared/schema");
    return await db.query.suppliers.findMany({
      where: eq(suppliers.userId, userId),
      orderBy: desc(suppliers.createdAt),
    });
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const { suppliers } = await import("@shared/schema");
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier> {
    const { suppliers } = await import("@shared/schema");
    const [updated] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async getPurchaseOrders(userId: string): Promise<any[]> {
    const { purchaseOrders } = await import("@shared/schema");
    const result = await db.query.purchaseOrders.findMany({
      where: eq(purchaseOrders.userId, userId),
      orderBy: desc(purchaseOrders.createdAt),
      with: { items: { with: { product: true } } }
    });
    return result;
  }

  async createPurchaseOrder(po: any, items: any[]): Promise<any> {
    const { purchaseOrders, purchaseOrderItems } = await import("@shared/schema");
    
    // Auto generate PO number if not provided
    if (!po.poNumber) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const count = await db.select().from(purchaseOrders).where(eq(purchaseOrders.userId, po.userId));
        po.poNumber = `PO-${dateStr}-${(count.length + 1).toString().padStart(4, "0")}`;
    }

    const [newPo] = await db.insert(purchaseOrders).values(po).returning();
    for (const item of items) {
      await db.insert(purchaseOrderItems).values({ ...item, poId: newPo.id });
    }
    return newPo;
  }

  async completePurchaseOrder(id: number): Promise<any> {
    const { purchaseOrders, inboundSessions, inboundItems } = await import("@shared/schema");
    
    const po = await db.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
        with: { items: true }
    });
    
    if (!po) throw new Error("PO tidak ditemukan");
    
    await db.update(purchaseOrders).set({ status: "completed", updatedAt: new Date() }).where(eq(purchaseOrders.id, id));
    
    // Create inbound session automatically from PO
    const [session] = await db.insert(inboundSessions).values({
      title: `Penerimaan PO: ${po.poNumber}`,
      userId: po.userId,
      status: "in_progress",
      notes: `Otomatis dari Purchase Order #${po.poNumber}`,
    }).returning();

    for (const item of po.items) {
      await db.insert(inboundItems).values({
        sessionId: session.id,
        productId: item.productId,
        quantityReceived: item.quantityOrdered,
        unitCost: item.unitPrice.toString(),
      });
    }
    return session;
  }

  // === Phase 16: RMA & Sales Returns ===
  async getSalesReturns(userId: string): Promise<any[]> {
    const { salesReturns, sales } = await import("@shared/schema");
    return await db.query.salesReturns.findMany({
      where: eq(salesReturns.userId, userId),
      orderBy: desc(salesReturns.createdAt),
      with: {
        sale: { with: { customer: true } },
      }
    });
  }

  async getSalesReturn(id: number): Promise<any> {
    const { salesReturns, sales } = await import("@shared/schema");
    return await db.query.salesReturns.findFirst({
      where: eq(salesReturns.id, id),
      with: {
        sale: { with: { customer: true } },
        items: { with: { product: true } }
      }
    });
  }

   async createSalesReturn(userId: string, data: any, items: any[]): Promise<any> {
    const { salesReturns, salesReturnItems, products, inventoryLots, saleItems } = await import("@shared/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    return await db.transaction(async (tx) => {
      // 0. Audit Security: Verify items against original sale
      const originalSaleItems = await tx.select().from(saleItems).where(eq(saleItems.saleId, data.saleId));
      if (originalSaleItems.length === 0) {
        throw new Error("Transaksi asli tidak ditemukan atau tidak memiliki item.");
      }

      // Check existing returns for this sale to prevent over-returning
      const existingReturns = await tx.select().from(salesReturnItems)
        .where(sql`${salesReturnItems.returnId} IN (SELECT id FROM sales_returns WHERE sale_id = ${data.saleId})`);

      for (const item of items) {
        const originalItem = originalSaleItems.find(si => si.productId === item.productId);
        if (!originalItem) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan dalam transaksi asli.`);
        }

        const alreadyReturned = existingReturns
          .filter(er => er.productId === item.productId)
          .reduce((sum, er) => sum + Number(er.quantityReturned), 0);

        if (Number(item.quantityReturned) + alreadyReturned > Number(originalItem.quantity)) {
          throw new Error(`Jumlah retur (${item.quantityReturned}) melebihi sisa barang yang bisa diretur (${Number(originalItem.quantity) - alreadyReturned}) untuk produk ${item.productId}.`);
        }
      }

      // 1. Create return header
      const [newReturn] = await tx.insert(salesReturns).values({ ...data, userId }).returning();

      for (const item of items) {
        // 2. Create return item
        await tx.insert(salesReturnItems).values({ ...item, returnId: newReturn.id });

        // 3. Handle inventory if restock status is 'restocked'
        if (item.restockStatus === "restocked") {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (product) {
              // Biarkan completeSalesReturn menangani restock ke produk dan inventoryLots
         }
       }
     }

      // 4. Create activity log
      await this.createActivityLog({
        userId,
        action: "CREATE_SALES_RETURN",
        entityType: "sales_return",
        entityId: newReturn.id,
        details: { returnNumber: newReturn.returnNumber, saleId: data.saleId, itemCount: items.length }
      });

      return newReturn;
    });
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async getCustomers(userId: string, branchId?: number): Promise<Customer[]> {
    const { eq, and } = await import("drizzle-orm");
    const whereClause = branchId
      ? and(eq(customers.userId, userId), eq(customers.branchId, branchId))
      : eq(customers.userId, userId);

    return await db.select().from(customers).where(whereClause).orderBy(desc(customers.createdAt));
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

  async getJournalEntries(userId: string, branchId?: number): Promise<any[]> {
    const entries = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.date));
    const result = [];
    for (const entry of entries) {
      const { eq, and } = await import("drizzle-orm");
      const itemConditions = [eq(journalItems.entryId, entry.id)];
      if (branchId !== undefined) {
        itemConditions.push(eq(journalItems.branchId, branchId));
      }

      const items = await db.select({
        id: journalItems.id,
        entryId: journalItems.entryId,
        accountId: journalItems.accountId,
        debit: journalItems.debit,
        credit: journalItems.credit,
        userId: journalItems.userId,
        branchId: journalItems.branchId,
        accountName: accounts.name,
        accountCode: accounts.code,
      })
      .from(journalItems)
      .leftJoin(accounts, eq(journalItems.accountId, accounts.id))
      .where(and(...itemConditions));
      
      // Only include entries that have items matching the branch filter
      if (items.length > 0) {
        result.push({ ...entry, items });
      }
    }
    return result;
  }

  async createJournalEntry(entry: InsertJournalEntry, items: Omit<InsertJournalItem, "entryId" | "id">[]): Promise<JournalEntry> {
    const totalDebit = items.reduce((sum, i) => sum + Number(i.debit || 0), 0);
    const totalCredit = items.reduce((sum, i) => sum + Number(i.credit || 0), 0);

    // Tolerance for floating point precision if any
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Jurnal tidak seimbang: Total Debit (${totalDebit}) != Total Credit (${totalCredit}). Selisih: ${Math.abs(totalDebit - totalCredit)}`);
    }

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
        { code: "2102", name: "Hutang Pajak (Tax Payable - PB1/PPN)", type: "liability", userId },
        { code: "2103", name: "Alokasi Biaya Produksi (Overhead & Tenaga Kerja)", type: "liability", userId },
        { code: "3101", name: "Modal Pemilik", type: "equity", userId },
        { code: "4101", name: "Penjualan Barang", type: "income", userId },
        { code: "4201", name: "Pendapatan Selisih Stok (Lebih)", type: "income", userId },
        { code: "5101", name: "Harga Pokok Penjualan (HPP)", type: "expense", userId },
        { code: "5102", name: "Beban Selisih Stok (Kurang)", type: "expense", userId },
        { code: "5201", name: "Biaya Operasional", type: "expense", userId },
      ];
      await db.insert(accounts).values(defaults);
    }
  }

  async autoJournalSale(saleId: number, userId: string, totalAmount: number, totalCogs: number, type: string = "pos", taxAmount: number = 0, branchId?: number, txContext?: any) {
    await this.ensureDefaultAccounts(userId);
    const userAccounts = await this.getAccounts(userId);

    const findAccount = (code: string) => userAccounts.find(a => a.code === code);
    const cashAcc = findAccount("1101");
    const salesAcc = findAccount("4101");
    const hppAcc = findAccount("5101");
    const invAcc = findAccount("1201");
    const receivableAcc = findAccount("1103");
    const taxAcc = findAccount("2102");

    if (!cashAcc || !salesAcc || !hppAcc || !invAcc || !receivableAcc) return;

    const executor = txContext || db;

    // 1. Journal Sale
    const debitAccount = type === "pos" ? cashAcc.id : receivableAcc.id;
    const descPrefix = type === "pos" ? "Penjualan POS" : "Penjualan Invoice";

    const pureRevenue = totalAmount - taxAmount;
    const jItems = [
      { accountId: debitAccount, debit: totalAmount, credit: 0, userId, branchId },
      { accountId: salesAcc.id, debit: 0, credit: pureRevenue, userId, branchId },
    ];

    if (taxAmount > 0 && taxAcc) {
      jItems.push({ accountId: taxAcc.id, debit: 0, credit: taxAmount, userId, branchId });
    }

    const { journalEntries, journalItems } = await import("@shared/schema");

    const saleEntry = { description: `${descPrefix} #${saleId}`, reference: `SALE-${saleId}`, userId, date: new Date() };
    const [newSaleEntry] = await executor.insert(journalEntries).values(saleEntry).returning();
    for (const item of jItems) {
      await executor.insert(journalItems).values({ ...item, entryId: newSaleEntry.id } as InsertJournalItem);
    }

    // 2. Journal COGS (Debit HPP, Credit Inventory)
    if (totalCogs > 0) {
      const cogsEntry = { description: `HPP ${descPrefix} #${saleId}`, reference: `SALE-${saleId}`, userId, date: new Date() };
      const [newCogsEntry] = await executor.insert(journalEntries).values(cogsEntry).returning();
      const cogsItems = [
          { accountId: hppAcc.id, debit: totalCogs, credit: 0, userId, branchId },
          { accountId: invAcc.id, debit: 0, credit: totalCogs, userId, branchId },
      ];
      for (const item of cogsItems) {
        await executor.insert(journalItems).values({ ...item, entryId: newCogsEntry.id } as InsertJournalItem);
      }
    }
  }

  async createAccountingEntriesForInbound(sessionId: number) {
    const { eq } = await import("drizzle-orm");
    const [session] = await db.select().from(inboundSessions).where(eq(inboundSessions.id, sessionId));
    if (!session) return;

    const items = await db.select().from(inboundItems).where(eq(inboundItems.sessionId, sessionId));
    
    let totalInboundCost = 0;
    for (const item of items) {
      totalInboundCost += (Number(item.quantityReceived || 0) * Number(item.unitCost || 0));
    }

    if (totalInboundCost <= 0) return;

    await this.ensureDefaultAccounts(session.userId);
    const userAccounts = await this.getAccounts(session.userId);
    const findAccount = (code: string) => userAccounts.find(a => a.code === code);

    const invAcc = findAccount("1201"); // Persediaan
    const payableAcc = findAccount("2101"); // Hutang Usaha

    if (!invAcc || !payableAcc) return;

    await this.createJournalEntry(
      { 
        description: `Penerimaan Barang (Inbound) #${session.id} - ${session.title}`, 
        reference: `INB-${session.id}`, 
        userId: session.userId, 
        date: new Date() 
      },
      [
        { accountId: invAcc.id, debit: totalInboundCost, credit: 0, userId: session.userId, branchId: session.branchId },
        { accountId: payableAcc.id, debit: 0, credit: totalInboundCost, userId: session.userId, branchId: session.branchId },
      ]
    );
  }

  async autoJournalPettyCash(sessionId: number, type: "in" | "out", amount: number, description: string, userId: string) {
    await this.ensureDefaultAccounts(userId);
    const userAccounts = await this.getAccounts(userId);
    const findAccount = (code: string) => userAccounts.find(a => a.code === code);

    const cashAcc = findAccount("1101");
    const expenseAcc = findAccount("5201");
    const incomeAcc = findAccount("4201");

    if (!cashAcc || !expenseAcc || !incomeAcc) return;

    const [session] = await db.select().from(posSessions).where(eq(posSessions.id, sessionId));
    const branchId = session?.branchId || undefined;

    const jItems = [];
    if (type === "out") {
      // Debit Expense, Credit Cash
      jItems.push({ accountId: expenseAcc.id, debit: amount, credit: 0, userId, branchId });
      jItems.push({ accountId: cashAcc.id, debit: 0, credit: amount, userId, branchId });
    } else {
      // Debit Cash, Credit Income
      jItems.push({ accountId: cashAcc.id, debit: amount, credit: 0, userId, branchId });
      jItems.push({ accountId: incomeAcc.id, debit: 0, credit: amount, userId, branchId });
    }

    await this.createJournalEntry(
      { 
        description: `Kas Kecil POS: ${description}`, 
        reference: `PC-${sessionId}`, 
        userId, 
        date: new Date() 
      },
      jItems
    );
  }

  async autoJournalStockAdjustment(sessionId: number, userId: string, adjustments: { type: "shrinkage" | "surplus", amount: number, productName: string, branchId?: number }[]) {
    await this.ensureDefaultAccounts(userId);
    const userAccounts = await this.getAccounts(userId);
    const findAccount = (code: string) => userAccounts.find(a => a.code === code);

    const invAcc = findAccount("1201");
    const shrinkageAcc = findAccount("5102");
    const surplusAcc = findAccount("4201");

    if (!invAcc || !shrinkageAcc || !surplusAcc) return;

    for (const adj of adjustments) {
      if (adj.amount <= 0) continue;

      if (adj.type === "shrinkage") {
        // Debit Beban Selisih, Credit Persediaan
        await this.createJournalEntry(
          { description: `Selisih Stok Kurang (Shrinkage) Opname #${sessionId}: ${adj.productName}`, reference: `OPN-${sessionId}`, userId, date: new Date() },
          [
            { accountId: shrinkageAcc.id, debit: adj.amount, credit: 0, userId, branchId: adj.branchId },
            { accountId: invAcc.id, debit: 0, credit: adj.amount, userId, branchId: adj.branchId },
          ]
        );
      } else {
        // Debit Persediaan, Credit Pendapatan Selisih
        await this.createJournalEntry(
          { description: `Selisih Stok Lebih (Surplus) Opname #${sessionId}: ${adj.productName}`, reference: `OPN-${sessionId}`, userId, date: new Date() },
          [
            { accountId: invAcc.id, debit: adj.amount, credit: 0, userId, branchId: adj.branchId },
            { accountId: surplusAcc.id, debit: 0, credit: adj.amount, userId, branchId: adj.branchId },
          ]
        );
      }
    }
  }

  async deductFifoStockAndGetCogs(productId: number, quantity: number, branchId?: number, txContext?: any): Promise<number> {
    const { eq, and, gt, asc, desc, isNull, or } = await import("drizzle-orm");
    const executor = txContext || db;
    
    // Filter by branch if provided, otherwise fallback to general lots (for backward compatibility)
    const branchFilter = branchId 
        ? eq(inventoryLots.branchId, branchId) 
        : isNull(inventoryLots.branchId);

    const lots = await executor.select().from(inventoryLots)
      .where(and(
        eq(inventoryLots.productId, productId), 
        gt(inventoryLots.remainingQuantity, 0),
        branchFilter
      ))
      .orderBy(asc(inventoryLots.inboundDate));

    let qtyToDeduct = quantity;
    let totalCogs = 0;

    for (const lot of lots) {
      if (qtyToDeduct <= 0) break;

      const qtyFromLot = Math.min(qtyToDeduct, lot.remainingQuantity);
      totalCogs += qtyFromLot * Number(lot.purchasePrice);

      await executor.update(inventoryLots)
        .set({ remainingQuantity: lot.remainingQuantity - qtyFromLot })
        .where(eq(inventoryLots.id, lot.id));

      qtyToDeduct -= qtyFromLot;
    }

    // Fallback if not enough lots exist (sell beyond registered stock)
    if (qtyToDeduct > 0) {
      const [product] = await executor.select().from(products).where(eq(products.id, productId));
      if (product) {
        let fallbackCost = Number(product.unitCost || 0);
        // Phantom Profit Prevention: If unitCost is 0, try to find the last known purchase price
        if (fallbackCost === 0) {
          const [lastLot] = await executor.select().from(inventoryLots)
            .where(eq(inventoryLots.productId, productId))
            .orderBy(desc(inventoryLots.inboundDate));
            if (lastLot && Number(lastLot.purchasePrice) > 0) {
              fallbackCost = Number(lastLot.purchasePrice);
            } else {
              // If still 0, fallback to selling price minus arbitrary 30% margin to prevent wild 100% tax inflating
              fallbackCost = Number(product.sellingPrice || 0) * 0.7;
              console.warn(`>>> [AUDIT] FIFO Fallback triggered for product ${productId}. No lots or unitCost found. Using 70% of selling price: ${fallbackCost}`);
            }
          }
          totalCogs += qtyToDeduct * fallbackCost;
      }
    }

    return totalCogs;
  }

  async autoJournalVoid(saleId: number, userId: string, totalAmount: number, totalCogs: number, type: string = "pos", taxAmount: number = 0, branchId?: number, txContext?: any) {
    await this.ensureDefaultAccounts(userId);
    const userAccounts = await this.getAccounts(userId);

    const findAccount = (code: string) => userAccounts.find(a => a.code === code);
    const cashAcc = findAccount("1101");
    const salesAcc = findAccount("4101");
    const hppAcc = findAccount("5101");
    const invAcc = findAccount("1201");
    const receivableAcc = findAccount("1103");
    const taxAcc = findAccount("2102");

    if (!cashAcc || !salesAcc || !hppAcc || !invAcc || !receivableAcc) return;

    const executor = txContext || db;
    const { journalEntries, journalItems, sales } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const [saleInfo] = await executor.select().from(sales).where(eq(sales.id, saleId));

    // 1. Reverse Sale Journal
    const creditAccount = (type === "pos" || (saleInfo?.paymentStatus === "paid")) ? cashAcc.id : receivableAcc.id;
    const descPrefix = type === "pos" ? "Void Penjualan POS" : "Void Penjualan Invoice";

    const pureRevenue = totalAmount - taxAmount;
    const jItems = [
      { accountId: salesAcc.id, debit: pureRevenue, credit: 0, userId, branchId },
      { accountId: creditAccount, debit: 0, credit: totalAmount, userId, branchId },
    ];

    if (taxAmount > 0 && taxAcc) {
      jItems.push({ accountId: taxAcc.id, debit: taxAmount, credit: 0, userId, branchId });
    }

    const voidSaleEntry = { description: `${descPrefix} #${saleId}`, reference: `VOID-${saleId}`, userId, date: new Date() };
    const [newVoidSaleEntry] = await executor.insert(journalEntries).values(voidSaleEntry).returning();
    
    for (const item of jItems) {
      await executor.insert(journalItems).values({ ...item, entryId: newVoidSaleEntry.id } as InsertJournalItem);
    }

    // 2. Reverse COGS Journal
    if (totalCogs > 0) {
      const voidCogsEntry = { description: `Void HPP ${descPrefix} #${saleId}`, reference: `VOID-${saleId}`, userId, date: new Date() };
      const [newVoidCogsEntry] = await executor.insert(journalEntries).values(voidCogsEntry).returning();
      
      const cogsItems = [
          { accountId: invAcc.id, debit: totalCogs, credit: 0, userId, branchId },
          { accountId: hppAcc.id, debit: 0, credit: totalCogs, userId, branchId },
      ];
      
      for (const item of cogsItems) {
        await executor.insert(journalItems).values({ ...item, entryId: newVoidCogsEntry.id } as InsertJournalItem);
      }
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
  async getPOSSessions(userId: string, branchId?: number): Promise<any[]> {
    const { eq, and, or, desc } = await import("drizzle-orm");
    
    // Base query with user join to get cashier name and verify team
    const query = db.select({
      session: posSessions,
      user: {
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(posSessions)
    .leftJoin(users, eq(posSessions.userId, users.id))
    .orderBy(desc(posSessions.startTime));

    // Filter by team: sessions where the user's adminId is the requested userId, or the user is the admin themselves
    const teamConditions = or(
      eq(users.adminId, userId),
      eq(users.id, userId)
    );
    
    const whereClause = branchId
      ? and(teamConditions, eq(posSessions.branchId, branchId))
      : teamConditions;

    const sessions = await query.where(whereClause);

    const enrichedSessions = await Promise.all(sessions.map(async ({ session, user }) => {
      const sessionSales = await db.select().from(sales).where(and(eq(sales.sessionId, session.id), eq(sales.paymentStatus, "paid")));
      const totalSales = sessionSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const totalCashSales = sessionSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + Number(s.totalAmount), 0);

      const pettyCashEntries = await db.select().from(posPettyCash).where(eq(posPettyCash.sessionId, session.id));
      const pettyCashTotal = pettyCashEntries.reduce((sum, pc) => {
        return pc.type === 'in' ? sum + Number(pc.amount) : sum - Number(pc.amount);
      }, 0);

      return {
        ...session,
        user,
        totalSales,
        totalCashSales,
        pettyCashTotal
      };
    }));

    return enrichedSessions;
  }

  async getActivePOSSession(userId: string, branchId?: number): Promise<any | undefined> {
    const { eq, and, or, desc, isNull } = await import("drizzle-orm");
    
    // Joint query to ensure we get user info
    const conditions = [eq(posSessions.status, "open")];
    if (branchId) conditions.push(eq(posSessions.branchId, branchId));

    // We search for sessions where the user is either the one who started it OR part of the same team
    // But for "Active" check in terminal, it's usually specific to the current authenticated user
    // However, to be robust we join with users table
    const [result] = await db.select({
      session: posSessions,
      user: {
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(posSessions)
    .leftJoin(users, eq(posSessions.userId, users.id))
    .where(and(eq(posSessions.userId, userId), eq(posSessions.status, "open")))
    .orderBy(desc(posSessions.startTime))
    .limit(1);

    if (!result) return undefined;
    const { session, user } = result;

    // Calculate totals on the fly
    const sessionSales = await db.select().from(sales).where(
      and(
        eq(sales.sessionId, session.id), 
        eq(sales.paymentStatus, "paid"),
        isNull(sales.voidedAt)
      )
    );
    const totalSales = sessionSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalCashSales = sessionSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + Number(s.totalAmount), 0);

    const pettyCashEntries = await db.select().from(posPettyCash).where(eq(posPettyCash.sessionId, session.id));
    const pettyCashTotal = pettyCashEntries.reduce((sum, pc) => {
      return pc.type === 'in' ? sum + Number(pc.amount) : sum - Number(pc.amount);
    }, 0);

    return {
      ...session,
      user,
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
  async getTieredPricingAll(userId: string): Promise<TieredPricing[]> {
    return await db.select().from(tieredPricing).where(eq(tieredPricing.userId, userId)).orderBy(tieredPricing.minQuantity);
  }

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
    await this.createActivityLog({
      action: "CREATE",
      entityType: "category",
      entityId: result.id,
      userId: data.userId,
      details: { name: result.name }
    });
    return result;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category> {
    const [result] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    await this.createActivityLog({
      action: "UPDATE",
      entityType: "category",
      entityId: result.id,
      userId: result.userId || "system",
      details: { name: result.name, updates: Object.keys(updates) }
    });
    return result;
  }

  async deleteCategory(id: number): Promise<void> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    if (category) {
      await this.createActivityLog({
        action: "DELETE",
        entityType: "category",
        entityId: id,
        userId: category.userId || "system",
        details: { name: category.name }
      });
      await db.delete(categories).where(eq(categories.id, id));
    }
  }

  async getUnits(userId: string): Promise<Unit[]> {
    return await db.select().from(units).where(eq(units.userId, userId)).orderBy(desc(units.createdAt));
  }

  async createUnit(data: InsertUnit & { userId: string }): Promise<Unit> {
    const [result] = await db.insert(units).values(data).returning();
    await this.createActivityLog({
      action: "CREATE",
      entityType: "unit",
      entityId: result.id,
      userId: data.userId,
      details: { name: result.name }
    });
    return result;
  }

  async updateUnit(id: number, updates: Partial<InsertUnit>): Promise<Unit> {
    const [result] = await db.update(units).set(updates).where(eq(units.id, id)).returning();
    await this.createActivityLog({
      action: "UPDATE",
      entityType: "unit",
      entityId: result.id,
      userId: result.userId || "system",
      details: { name: result.name, updates: Object.keys(updates) }
    });
    return result;
  }

  async deleteUnit(id: number): Promise<void> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    if (unit) {
      await this.createActivityLog({
        action: "DELETE",
        entityType: "unit",
        entityId: id,
        userId: unit.userId || "system",
        details: { name: unit.name }
      });
      await db.delete(units).where(eq(units.id, id));
    }
  }

  // === Activity Logs ===
  async getActivityLogs(adminId: string, branchId?: number): Promise<ActivityLog[]> {
    // Current user context isn't enough, we need to find all logs related to this admin's team
    // But logs are indexed by userId. We need to join with users to filter by adminId.
    // However, to keep it simple, we'll fetch logs where branchId is provided or logs for current user.
    if (branchId !== undefined) {
      return await db.select().from(activityLogs).where(eq(activityLogs.branchId, branchId)).orderBy(desc(activityLogs.createdAt));
    }
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(data).returning();
    return log;
  }

  async checkStockIntegrity(userId: string): Promise<{ productId: number; sku: string; currentStock: number; lotStock: number; diff: number }[]> {
    const allProducts = await this.getProducts(userId);
    const result = [];
    
    for (const p of allProducts) {
      const lots = await db.select().from(inventoryLots).where(eq(inventoryLots.productId, p.id));
      const lotTotal = lots.reduce((sum, l) => sum + Number(l.remainingQuantity), 0);
      
      if (Number(p.currentStock) !== lotTotal) {
        result.push({
          productId: p.id,
          sku: p.sku,
          currentStock: Number(p.currentStock),
          lotStock: lotTotal,
          diff: Number(p.currentStock) - lotTotal
        });
      }
    }
    
    return result;
  }

  // === Stock Transfers ===
  async getStockTransfers(userId: string): Promise<any[]> {
    const results = await db.query.stockTransfers.findMany({
      where: eq(stockTransfers.userId, userId),
      with: {
        fromBranch: true,
        toBranch: true,
      },
      orderBy: desc(stockTransfers.createdAt),
    });
    return results;
  }

  async getStockTransfer(id: number): Promise<any | undefined> {
    const result = await db.query.stockTransfers.findFirst({
      where: eq(stockTransfers.id, id),
      with: {
        fromBranch: true,
        toBranch: true,
        items: {
          with: {
            product: true
          }
        }
      }
    });
    return result;
  }

  async createStockTransfer(userId: string, transfer: InsertStockTransfer, items: InsertStockTransferItem[]): Promise<any> {
    const [result] = await db.insert(stockTransfers).values({ ...transfer, userId }).returning();
    
    for (const item of items) {
      await db.insert(stockTransferItems).values({ ...item, transferId: result.id });
      
      // If status is in_transit, deduct stock from source branch immediately
      if (transfer.status === "in_transit" && transfer.fromBranchId) {
        // deductFifoStockAndGetCogs will handle lot reduction in the specific branch
        await this.deductFifoStockAndGetCogs(item.productId, item.quantity, transfer.fromBranchId);
      }
    }

    await this.createActivityLog({
      action: "CREATE_TRANSFER",
      entityType: "stock_transfer",
      entityId: result.id,
      userId,
      details: { from: transfer.fromBranchId, to: transfer.toBranchId, itemCount: items.length }
    });

    return result;
  }

  async completeStockTransfer(id: number, receivedBy: string): Promise<any> {
    const transfer = await this.getStockTransfer(id);
    if (!transfer || transfer.status === "received") return transfer;

    // 1. Update status
    const [updated] = await db.update(stockTransfers)
      .set({ status: "received", receivedBy, receivedAt: new Date() })
      .where(eq(stockTransfers.id, id))
      .returning();

    // 2. Add stock to Destination Branch (inventory_lots)
    if (transfer.toBranchId) {
      for (const item of transfer.items) {
        // Find existing unit cost for this product to maintain HPP (FIFO continuity)
        const product = await this.getProduct(item.productId);
        const cost = Number(product?.unitCost || 0);

        await db.insert(inventoryLots).values({
          productId: item.productId,
          branchId: transfer.toBranchId,
          purchasePrice: cost,
          initialQuantity: item.quantity,
          remainingQuantity: item.quantity,
          inboundDate: new Date(),
          notes: `Transfer from ${transfer.fromBranch?.name || "Other Branch"} (#${transfer.id})`
        });
      }
    }

    await this.createActivityLog({
      action: "COMPLETE_TRANSFER",
      entityType: "stock_transfer",
      entityId: id,
      userId: transfer.userId,
      details: { from: transfer.fromBranchId, to: transfer.toBranchId }
    });

    return updated;
  }

  async getConsolidatedStock(productId: number, userId: string): Promise<any[]> {
    const { branches: branchesTable } = await import("@shared/schema");
    const allBranches = await db.select().from(branchesTable).where(eq(branchesTable.userId, userId));
    const results = [];

    for (const branch of allBranches) {
      const lots = await db.select().from(inventoryLots)
        .where(and(eq(inventoryLots.productId, productId), eq(inventoryLots.branchId, branch.id)));
      
      const totalStock = lots.reduce((sum, l) => sum + Number(l.remainingQuantity), 0);
      results.push({
        branchId: branch.id,
        branchName: branch.name,
        branchType: branch.type,
        stock: totalStock
      });
    }
    return results;
  }

  async getLogisticsAlerts(userId: string): Promise<any[]> {
    const products = await this.getProducts(userId);
    const { branches: branchesTable } = await import("@shared/schema");
    const allBranches = await db.select().from(branchesTable).where(eq(branchesTable.userId, userId));
    const alerts: any[] = [];

    for (const p of products) {
      if (!p.minStock) continue;

      const branchStocks: any[] = [];
      for (const b of allBranches) {
        const lots = await db.select().from(inventoryLots)
          .where(and(eq(inventoryLots.productId, p.id), eq(inventoryLots.branchId, b.id)));
        const stock = lots.reduce((sum, l) => sum + Number(l.remainingQuantity), 0);
        branchStocks.push({ id: b.id, name: b.name, stock });
      }

      const lowBranches = branchStocks.filter(bs => bs.stock < p.minStock);
      const highBranches = branchStocks.filter(bs => bs.stock > (p.minStock * 2));

      if (lowBranches.length > 0 && highBranches.length > 0) {
        for (const target of lowBranches) {
          const source = highBranches[0]; // Simplistic: pick the first one with plenty of stock
          alerts.push({
            type: "STOCK_IMBALANCE",
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            fromBranchId: source.id,
            fromBranchName: source.name,
            toBranchId: target.id,
            toBranchName: target.name,
            suggestedQty: Math.ceil(p.minStock * 1.5 - target.stock),
            urgency: target.stock === 0 ? "high" : "medium"
          });
        }
      }
    }
    return alerts;
  }

  // === Phase 19: Analytics ===
  async getStockHealth(userId: string): Promise<{ totalItems: number; outOfStock: number; lowStock: number; healthy: number }> {
    const allProducts = await this.getProducts(userId);
    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;

    for (const p of allProducts) {
      if (p.currentStock <= 0) {
        outOfStock++;
      } else if (p.currentStock < (p.minStock || 0)) {
        lowStock++;
      } else {
        healthy++;
      }
    }

    return {
      totalItems: allProducts.length,
      outOfStock,
      lowStock,
      healthy
    };
  }

  async getTopSellingItems(userId: string, limit: number = 5): Promise<{ productId: number; name: string; totalQuantity: number; totalRevenue: number }[]> {
    const { sum, sql } = await import("drizzle-orm");
    const results = await db.select({
      productId: saleItems.productId,
      name: products.name,
      totalQuantity: sql<number>`CAST(SUM(${saleItems.quantity}) AS FLOAT)`,
      totalRevenue: sql<number>`CAST(SUM(${saleItems.subtotal}) AS FLOAT)`,
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(products.userId, userId))
    .groupBy(saleItems.productId, products.name)
    .orderBy(desc(sql`SUM(${saleItems.quantity})`))
    .limit(limit);

    return results;
  }

  async getCategoryPerformance(userId: string): Promise<{ category: string; totalItems: number; totalStock: number; totalValue: number; totalSales: number }[]> {
    const { sql, count } = await import("drizzle-orm");
    
    // First get stock and value per category
    const stockResults = await db.select({
      category: products.category,
      totalItems: count(products.id),
      totalStock: sql<number>`CAST(SUM(${products.currentStock}) AS FLOAT)`,
      totalValue: sql<number>`CAST(SUM(${products.currentStock} * ${products.sellingPrice}) AS FLOAT)`,
    })
    .from(products)
    .where(eq(products.userId, userId))
    .groupBy(products.category);

    // Then get sales per category
    const salesResults = await db.select({
      category: products.category,
      totalSales: sql<number>`CAST(SUM(${saleItems.subtotal}) AS FLOAT)`,
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(products.userId, userId))
    .groupBy(products.category);

    return stockResults.map(s => {
      const sales = salesResults.find(sr => sr.category === s.category);
      return {
        category: s.category || "Uncategorized",
        totalItems: s.totalItems,
        totalStock: s.totalStock || 0,
        totalValue: s.totalValue || 0,
        totalSales: sales?.totalSales || 0
      };
    });
  }

  // === Phase 20: Demand Forecasting ===
  async getInventoryDemand(userId: string): Promise<any[]> {
    const allProducts = await this.getProducts(userId);
    const results = [];

    for (const p of allProducts) {
      // Get sales for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [salesCount] = await db.select({
        total: sql<number>`CAST(SUM(${saleItems.quantity}) AS FLOAT)`
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(
        eq(saleItems.productId, p.id),
        gt(sales.createdAt, thirtyDaysAgo)
      ));

      const monthlySales = salesCount?.total || 0;
      const dailyVelocity = monthlySales / 30;
      const daysLeft = dailyVelocity > 0 ? (p.currentStock / dailyVelocity) : 999;

      results.push({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        monthlySales,
        dailyVelocity,
        daysLeft,
        suggestedRestock: daysLeft < 7 ? Math.ceil(dailyVelocity * 14 - p.currentStock) : 0
      });
    }

    return results;
  }

  async getSalesForecast(userId: string): Promise<any> {
    const { sql } = await import("drizzle-orm");
    const results = await db.select({
      date: sql<string>`DATE(${sales.createdAt})`,
      total: sql<number>`CAST(SUM(${sales.totalAmount}) AS FLOAT)`
    })
    .from(sales)
    .where(eq(sales.userId, userId))
    .groupBy(sql`DATE(${sales.createdAt})`)
    .orderBy(desc(sql`DATE(${sales.createdAt})`))
    .limit(30);

    return results;
  }

  async getInventoryAging(userId: string): Promise<any> {
    const results = await db.select({
      productId: inventoryLots.productId,
      name: products.name,
      totalQuantity: sql<number>`CAST(SUM(${inventoryLots.remainingQuantity}) AS FLOAT)`,
      avgAgeDays: sql<number>`CAST(AVG(EXTRACT(DAY FROM NOW() - ${inventoryLots.inboundDate})) AS FLOAT)`
    })
    .from(inventoryLots)
    .innerJoin(products, eq(inventoryLots.productId, products.id))
    .where(eq(products.userId, userId))
    .groupBy(inventoryLots.productId, products.name)
    .having(gt(sql`SUM(${inventoryLots.remainingQuantity})`, 0));

    return results;
  }

  // === Phase 22: SaaS Console Backend ===
  async getSaaSMetrics(adminId: string): Promise<any> {
    const { sql, and, gt, desc } = await import("drizzle-orm");
    
    // 1. Total Revenue (Lifetime)
    const [revenueResult] = await db.select({
      total: sql<number>`CAST(SUM(${sales.totalAmount}) AS FLOAT)`
    }).from(sales);

    // 2. Monthly Revenue (Current Month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const [monthlyRevenueResult] = await db.select({
      total: sql<number>`CAST(SUM(${sales.totalAmount}) AS FLOAT)`
    }).from(sales).where(gt(sales.createdAt, firstDayOfMonth));

    // 3. User Stats
    const [totalUsersResult] = await db.select({
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`
    }).from(users);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const [activeUsersResult] = await db.select({
      count: sql<number>`CAST(COUNT(DISTINCT ${posSessions.userId}) AS INTEGER)`
    }).from(posSessions).where(gt(posSessions.startTime, twentyFourHoursAgo));

    // 4. Activity Volume (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [activityCount] = await db.select({
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`
    }).from(activityLogs).where(gt(activityLogs.createdAt, sevenDaysAgo));

    return {
      totalRevenue: revenueResult?.total || 0,
      monthlyRevenue: monthlyRevenueResult?.total || 0,
      totalUsers: totalUsersResult?.count || 0,
      activeUsers: activeUsersResult?.count || 0,
      activityScore: activityCount?.count || 0,
      uptime: 99.9,
      systemLoad: 12.5, // Simulated %
      storageUsed: 42.5 * 1024 * 1024 * 1024, // Simulated (convert to bytes for consistency)
      storageTotal: 100 * 1024 * 1024 * 1024, // Simulated 100 GB
      apiCallsToday: 1250, // Simulated
      apiCallsLimit: 50000, // Simulated
    };
  }

  async getModuleSubscriptions(userId: string): Promise<any[]> {
    return await db.select().from(moduleSubscriptions).where(eq(moduleSubscriptions.userId, userId)).orderBy(desc(moduleSubscriptions.createdAt));
  }

  async getSaaSActivityLogs(adminId: string): Promise<any[]> {
    const { desc } = await import("drizzle-orm");
    // Fetch critical logs for SaaS dashboard
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(20);
  }

  // === Phase 23: Report Hub Backend ===
  async getSalesSummary(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const { sql, and, lte, gte } = await import("drizzle-orm");
    
    // Default to last 30 days if not provided
    const computedEndDate = endDate || new Date();
    const computedStartDate = startDate || new Date();
    if (!startDate) computedStartDate.setDate(computedStartDate.getDate() - 30);

    const conditions = [
      eq(sales.userId, userId),
      gte(sales.createdAt, computedStartDate),
      lte(sales.createdAt, computedEndDate),
      sql`${sales.voidedAt} IS NULL`
    ];

    const [result] = await db.select({
      revenue: sql<number>`CAST(SUM(${sales.totalAmount}) AS FLOAT)`,
      discount: sql<number>`CAST(SUM(${sales.discountAmount}) AS FLOAT)`,
      tax: sql<number>`CAST(SUM(${sales.taxAmount}) AS FLOAT)`,
      transactionCount: sql<number>`CAST(COUNT(*) AS INTEGER)`
    })
    .from(sales)
    .where(and(...conditions));

    const [cogsResult] = await db.select({
      totalCogs: sql<number>`CAST(SUM(${saleItems.cogs}) AS FLOAT)`
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(...conditions));

    const revenue = result?.revenue || 0;
    const cogs = cogsResult?.totalCogs || 0;
    const grossProfit = revenue - cogs;
    const transactionCount = result?.transactionCount || 0;

    return {
      revenue,
      cogs,
      grossProfit,
      discount: result?.discount || 0,
      tax: result?.tax || 0,
      transactionCount,
      averageOrderValue: transactionCount > 0 ? revenue / transactionCount : 0
    };
  }

  async getSalesItemsReport(userId: string, sortBy: string = "revenue", startDate?: Date, endDate?: Date): Promise<any[]> {
    const { sql, and, desc, lte, gte } = await import("drizzle-orm");

    const computedEndDate = endDate || new Date();
    const computedStartDate = startDate || new Date();
    if (!startDate) computedStartDate.setDate(computedStartDate.getDate() - 30);

    const results = await db.select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      qty: sql<number>`CAST(SUM(${saleItems.quantity}) AS FLOAT)`,
      revenue: sql<number>`CAST(SUM(${saleItems.subtotal}) AS FLOAT)`,
      cogs: sql<number>`CAST(SUM(${saleItems.cogs}) AS FLOAT)`,
      profit: sql<number>`CAST(SUM(${saleItems.subtotal} - ${saleItems.cogs}) AS FLOAT)`
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(
      eq(sales.userId, userId),
      sql`${sales.voidedAt} IS NULL`,
      gte(sales.createdAt, computedStartDate),
      lte(sales.createdAt, computedEndDate)
    ))
    .groupBy(products.id, products.sku, products.name)
    .orderBy(sortBy === "qty" ? desc(sql`SUM(${saleItems.quantity})`) : desc(sql`SUM(${saleItems.subtotal})`))
    .limit(100);

    return results;
  }

  // === Phase 16: RMA & Sales Returns ===
  async createSalesReturn(data: InsertSalesReturn & { items: InsertSalesReturnItem[] }): Promise<SalesReturn> {
    return await db.transaction(async (tx) => {
      const [newReturn] = await tx.insert(salesReturns).values(data).returning();
      for (const item of data.items) {
        await tx.insert(salesReturnItems).values({ ...item, returnId: newReturn.id } as any);
      }
      return newReturn;
    });
  }

  async completeSalesReturn(id: number): Promise<SalesReturn> {
    const { eq } = await import("drizzle-orm");
    return await db.transaction(async (tx) => {
      const [salesReturn] = await tx.update(salesReturns)
        .set({ status: "completed" })
        .where(eq(salesReturns.id, id))
        .returning();

      if (!salesReturn) throw new Error("Sales Return not found");

      const items = await tx.select().from(salesReturnItems).where(eq(salesReturnItems.returnId, id));
      
      let totalCogsReturned = 0;

      for (const item of items) {
        if (item.restockStatus === "restocked") {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (product) {
            await tx.update(products)
              .set({ currentStock: product.currentStock + item.quantityReturned })
              .where(eq(products.id, item.productId));

            const [saleItem] = await tx.select().from(saleItems).where(eq(saleItems.id, item.saleItemId));
            const originalCogsUnit = saleItem && Number(saleItem.quantity) > 0 
                ? (Number(saleItem.cogs) / Number(saleItem.quantity)) 
                : Number(product.unitCost || 0);

            totalCogsReturned += (originalCogsUnit * item.quantityReturned);

            await tx.insert(inventoryLots).values({
              productId: item.productId,
              branchId: null, // Central location by default
              purchasePrice: originalCogsUnit.toString(),
              initialQuantity: item.quantityReturned,
              remainingQuantity: item.quantityReturned,
              inboundDate: new Date(),
              notes: `Retur Penjualan #${salesReturn.returnNumber}`
            } as any);
          }
        }
      }

      const { sales, users } = await import("@shared/schema");
      const [saleInfo] = await tx.select().from(sales).where(eq(sales.id, salesReturn.saleId));

      if (saleInfo) {
         await this.autoJournalVoid(
           salesReturn.saleId, 
           salesReturn.userId, 
           Number(salesReturn.totalRefundAmount), 
           totalCogsReturned, 
           saleInfo.type || "pos", 
           0, 
           saleInfo.branchId || undefined, 
           tx
         );
      }

      return salesReturn;
    });
  }

  async getSalesReturns(userId: string): Promise<SalesReturn[]> {
    const { eq, desc } = await import("drizzle-orm");
    return await db.select()
      .from(salesReturns)
      .where(eq(salesReturns.userId, userId))
      .orderBy(desc(salesReturns.createdAt));
  }

  // === Phase 9: Stock Transfers (Logistics) ===
  async getStockTransfers(userId: string): Promise<StockTransfer[]> {
    const { eq, desc } = await import("drizzle-orm");
    return await db.select()
      .from(stockTransfers)
      .where(eq(stockTransfers.userId, userId))
      .orderBy(desc(stockTransfers.createdAt));
  }

  async getStockTransfer(id: number): Promise<StockTransferWithItems | null> {
    const { eq } = await import("drizzle-orm");
    const [transfer] = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id));
    if (!transfer) return null;

    const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));
    
    // Attach products
    const itemsWithProduct = await Promise.all(items.map(async (item) => {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      return { ...item, product };
    }));

    const [fromBranch] = transfer.fromBranchId ? await db.select().from(branches).where(eq(branches.id, transfer.fromBranchId)) : [null];
    const [toBranch] = transfer.toBranchId ? await db.select().from(branches).where(eq(branches.id, transfer.toBranchId)) : [null];

    return { ...transfer, items: itemsWithProduct, fromBranch, toBranch } as any;
  }

  async createStockTransfer(userId: string, data: InsertStockTransfer, items: InsertStockTransferItem[]): Promise<StockTransfer> {
    return await db.transaction(async (tx) => {
      const [newTransfer] = await tx.insert(stockTransfers).values(data).returning();
      for (const item of items) {
        await tx.insert(stockTransferItems).values({ ...item, transferId: newTransfer.id } as any);
      }
      return newTransfer;
    });
  }

  async completeStockTransfer(id: number, receivedBy: string): Promise<StockTransfer> {
    const { eq } = await import("drizzle-orm");
    return await db.transaction(async (tx) => {
      const [transfer] = await tx.update(stockTransfers)
        .set({ status: "received", receivedBy, receivedAt: new Date() })
        .where(eq(stockTransfers.id, id))
        .returning();

      if (!transfer) throw new Error("Stock transfer not found");

      const items = await tx.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, id));

      for (const item of items) {
        // Implement Stock Movement
        // Asumsi: Outbound (Origin Branch) sudah dikurangi stocknya di createStockTransfer atau saat status "in_transit"
        // Tapi untuk simplifikasi (karena nggak ada logic Outbound khusus sebelumnya): Kita update global stock kalau cabang diabaikan
        // ATAU kita tidak ganti global stock, tapi kita bikin mutasi Lot:
        
        const receivedQty = item.receivedQuantity || item.quantity;

        // Ambil HPP via FIFO dari fromBranch, lalu pindahkan ke toBranch
        const originCogs = await this.deductFifoStockAndGetCogs(item.productId, receivedQty, transfer.fromBranchId || undefined, tx);
        const unitCogs = originCogs / receivedQty;

        // Masukkan kembali ke Lot di toBranch
        await tx.insert(inventoryLots).values({
          productId: item.productId,
          branchId: transfer.toBranchId,
          purchasePrice: unitCogs.toString(),
          initialQuantity: receivedQty,
          remainingQuantity: receivedQty,
          inboundDate: new Date(),
          notes: `Penerimaan Mutasi #${transfer.id}`
        } as any);

      }

      return transfer;
    });
  }

  async getStockLedger(userId: string, productId?: number): Promise<any[]> {
    const { desc, and } = await import("drizzle-orm");
    
    const conditions = [eq(activityLogs.userId, userId)];
    if (productId) {
      conditions.push(eq(activityLogs.entityId, productId));
      conditions.push(eq(activityLogs.entityType, "product"));
    } else {
      conditions.push(eq(activityLogs.entityType, "product"));
    }

    // Capture logs that affect stock
    const logs = await db.select()
      .from(activityLogs)
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(100);

    return logs.map(log => ({
      id: log.id,
      date: log.createdAt,
      action: log.action,
      entityId: log.entityId,
      details: log.details,
    }));
  }
  // === Business Verticals (Laundry, Restaurants, Barbershop) ===
  async getAppointments(userId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(desc(appointments.startTime));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [result] = await db.insert(appointments).values(appointment).returning();
    return result;
  }

  async updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment> {
    const [result] = await db.update(appointments).set(data).where(eq(appointments.id, id)).returning();
    return result;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getRestaurantTables(userId: string): Promise<RestaurantTable[]> {
    return await db.select().from(restaurantTables).where(eq(restaurantTables.userId, userId)).orderBy(restaurantTables.tableNumber);
  }

  async createRestaurantTable(table: InsertRestaurantTable): Promise<RestaurantTable> {
    const [result] = await db.insert(restaurantTables).values(table).returning();
    return result;
  }

  async updateRestaurantTable(id: number, data: Partial<InsertRestaurantTable>): Promise<RestaurantTable> {
    const [result] = await db.update(restaurantTables).set(data).where(eq(restaurantTables.id, id)).returning();
    return result;
  }

  async deleteRestaurantTable(id: number): Promise<void> {
    await db.delete(restaurantTables).where(eq(restaurantTables.id, id));
  }

  async getOrderStatusLogs(orderId: string): Promise<OrderStatusLog[]> {
    return await db.select().from(orderStatusLogs).where(eq(orderStatusLogs.orderId, orderId)).orderBy(desc(orderStatusLogs.createdAt));
  }

  async createOrderStatusLog(log: InsertOrderStatusLog): Promise<OrderStatusLog> {
    const [result] = await db.insert(orderStatusLogs).values(log).returning();
    return result;
  }

  async getProductModifiers(productId: number): Promise<ProductModifier[]> {
    return await db.select().from(productModifiers).where(eq(productModifiers.productId, productId)).orderBy(productModifiers.name);
  }

  async createProductModifier(modifier: InsertProductModifier): Promise<ProductModifier> {
    const [result] = await db.insert(productModifiers).values(modifier).returning();
    return result;
  }

  async deleteProductModifier(id: number): Promise<void> {
    await db.delete(productModifiers).where(eq(productModifiers.id, id));
  }
}

export const storage = new DatabaseStorage();
