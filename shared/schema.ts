import { pgTable, text, serial, integer, timestamp, real, customType, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users, type User } from "./models/auth";

export * from "./models/auth";

export const decimal = customType<{ data: number; driverData: string }>({
  dataType() {
    return 'numeric(15, 2)';
  },
  toDriver(value: number): string {
    return value.toString();
  },
  fromDriver(value: string): number {
    return Number(value);
  },
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role", { enum: ["admin", "driver", "cashier", "production", "sku_manager", "stock_counter", "stock_counter_toko", "stock_counter_gudang"] }).default("stock_counter").notNull(),
});

export const moduleSubscriptions = pgTable("module_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moduleName: text("module_name").notNull(), // e.g., 'pos', 'accounting', 'production'
  orderId: text("order_id").notNull().unique(), // e.g., MID-xxx
  amount: decimal("amount").notNull(),
  status: text("status", { enum: ["pending", "settlement", "expire", "cancel"] }).default("pending").notNull(),
  paymentUrl: text("payment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  subCategory: text("sub_category"),
  productCode: text("product_code"),
  description: text("description"),
  currentStock: decimal("current_stock").default("0").notNull(),
  unitCost: decimal("unit_cost").default(0),
  sellingPrice: decimal("selling_price").default(0),
  photoUrl: text("photo_url"),
  userId: text("user_id").notNull(),
  locationType: text("location_type", { enum: ["toko", "gudang"] }).default("toko"),
  productType: text("product_type", { enum: ["finished_good", "raw_material", "component"] }).default("finished_good").notNull(),
  minStock: decimal("min_stock").default("0").notNull(),
  isTaxable: integer("is_taxable").default(1).notNull(),
  taxRate: decimal("tax_rate").default(11.0).notNull(),
  isBundled: integer("is_bundled").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryLots = pgTable("inventory_lots", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  branchId: integer("branch_id").references(() => branches.id), // Where this stock is physically located
  purchasePrice: decimal("purchase_price").notNull(),
  initialQuantity: decimal("initial_quantity").notNull(),
  remainingQuantity: decimal("remaining_quantity").notNull(),
  inboundDate: timestamp("inbound_date").defaultNow().notNull(),
  inboundSessionId: integer("inbound_session_id"), // Optional reference to inboundSessions.id
  expiryDate: timestamp("expiry_date"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productPhotos = pgTable("product_photos", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productUnits = pgTable("product_units", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  unitName: text("unit_name").notNull(),
  conversionToBase: decimal("conversion_to_base").default(1).notNull(),
  baseUnit: text("base_unit").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const opnameSessions = pgTable("opname_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["in_progress", "completed"] }).default("in_progress").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  locationType: text("location_type", { enum: ["toko", "gudang"] }).default("toko"),
  startedByName: text("started_by_name"),
  assignedTo: text("assigned_to"),
  gDriveUrl: text("g_drive_url"),
  backupStatus: text("backup_status", { enum: ["none", "pending", "moved", "verified"] }).default("none").notNull(),
  backupLogs: text("backup_logs"),
  branchId: integer("branch_id"),
});

export const opnameRecords = pgTable("opname_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => opnameSessions.id).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  actualStock: integer("actual_stock"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  unitValues: text("unit_values"),
  countedBy: text("counted_by"),
  returnedQuantity: integer("returned_quantity").default(0),
  returnedNotes: text("returned_notes"),
});

export const opnameRecordPhotos = pgTable("opname_record_photos", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id").references(() => opnameRecords.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staffMembers = pgTable("staff_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  locationType: text("location_type", { enum: ["toko", "gudang"] }).default("toko"),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
  commissionRate: decimal("commission_rate").default(0), // Persentase komisi (0-100)
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  type: text("type", { enum: ["kritik", "saran"] }).default("saran").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const motivationMessages = pgTable("motivation_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
});

export const categoryPriorities = pgTable("category_priorities", {
  id: serial("id").primaryKey(),
  categoryName: text("category_name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  userId: text("user_id").notNull(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  type: text("type", { enum: ["warehouse", "store", "factory"] }).default("store").notNull(),
  userId: text("user_id"),
  active: integer("active").default(1).notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  branchId: integer("branch_id"),
  entityType: text("entity_type"), // Optional for activity logs
  entityId: integer("entity_id"), // Optional for activity logs
  action: text("action").notNull(), // LOGIN, START_OPNAME, COMPLETE_OPNAME, UPDATE_STOCK
  details: jsonb("details"), // Ubah ke jsonb agar bisa menyimpan objek dinamis (Fase 5 Stabilization)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// === Inbound (Barang Masuk) ===
export const inboundSessions = pgTable("inbound_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["in_progress", "completed"] }).default("in_progress").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  senderName: text("sender_name"),
  receiverName: text("receiver_name"),
  senderSignature: text("sender_signature"),
  receiverSignature: text("receiver_signature"),
});

export const inboundItems = pgTable("inbound_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => inboundSessions.id).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantityReceived: decimal("quantity_received").notNull(),
  unitCost: decimal("unit_cost").default("0").notNull(),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
});

export const inboundItemPhotos = pgTable("inbound_item_photos", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inboundItems.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Suppliers (Vendor Management) ===
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Outbound (Barang Keluar / Transfer) ===
export const outboundSessions = pgTable("outbound_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["draft", "shipped", "received"] }).default("draft").notNull(),
  fromBranchId: integer("from_branch_id").references(() => branches.id), // Origin branch
  toBranchId: integer("to_branch_id").references(() => branches.id), // Destination branch (if transfer)
  startedAt: timestamp("started_at").defaultNow().notNull(),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  senderName: text("sender_name"),
  driverName: text("driver_name"),
  receiverName: text("receiver_name"),
  senderSignature: text("sender_signature"),
  driverSignature: text("driver_signature"),
  receiverSignature: text("receiver_signature"),
});

export const outboundItems = pgTable("outbound_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => outboundSessions.id).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantityShipped: decimal("quantity_shipped").notNull(),
  quantityReceived: decimal("quantity_received"),
  notes: text("notes"),
});

export const outboundItemPhotos = pgTable("outbound_item_photos", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => outboundItems.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === BOM (Perakitan) ===
export const boms = pgTable("boms", {
  id: serial("id").primaryKey(),
  targetProductId: integer("target_product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  version: text("version").default("1.0"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
});

export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => boms.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantityNeeded: decimal("quantity_needed").notNull(),
});

export const assemblySessions = pgTable("assembly_sessions", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => boms.id).notNull(),
  quantityProduced: decimal("quantity_produced").notNull(),
  laborCost: decimal("labor_cost").default(0), // Optional addition to HPP
  overheadCost: decimal("overhead_cost").default(0), // Optional addition to HPP
  status: text("status").default("completed").notNull(),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Pricing & Bundling ===
export const tieredPricing = pgTable("tiered_pricing", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  minQuantity: decimal("min_quantity").notNull(),
  price: decimal("price").notNull(),
  userId: text("user_id").notNull(),
});

export const productBundles = pgTable("product_bundles", {
  id: serial("id").primaryKey(),
  parentProductId: integer("parent_product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  childProductId: integer("child_product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantity: decimal("quantity").notNull(),
});

// === CRM & Sales (POS) ===
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  points: integer("points").default(0).notNull(),
  userId: text("user_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull(),
  invoiceNumber: text("invoice_number").unique(),
  customerId: integer("customer_id").references(() => customers.id),
  totalAmount: decimal("total_amount").notNull(),
  discountAmount: decimal("discount_amount").default(0).notNull(),
  taxAmount: decimal("tax_amount").default(0).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, transfer, qris
  paymentStatus: text("payment_status").notNull(), // paid, pending, partial, overdue
  notes: text("notes"),
  userId: text("user_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  type: text("type").default("pos").notNull(), // pos, erp_invoice
  dueDate: timestamp("due_date"),
  salespersonId: text("salesperson_id"),
  voidedAt: timestamp("voided_at"),
  voidedBy: text("voided_by"),
  sessionId: integer("session_id").references(() => posSessions.id),
  voucherId: integer("voucher_id").references(() => vouchers.id),
  pointsRedeemed: integer("points_redeemed").default(0).notNull(),
  pointsValueRedeemed: decimal("points_value_redeemed").default(0).notNull(),
  orderId: text("order_id"), // Added for Report Hub compatibility
  tableId: integer("table_id").references(() => restaurantTables.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["fixed", "percentage"] }).notNull(),
  value: decimal("value").notNull(),
  startTime: text("start_time"), // HH:mm
  endTime: text("end_time"),     // HH:mm
  daysOfWeek: text("days_of_week"), // 0-6 comma separated
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantity: decimal("quantity").notNull(),
  unitPrice: decimal("unit_price").notNull(),
  subtotal: decimal("subtotal").notNull(),
  discountAmount: decimal("discount_amount").default(0).notNull(),
  cogs: decimal("cogs").default(0).notNull(), // Total HPP persis hasil FIFO untuk item ini
  appliedPromotionId: integer("applied_promotion_id").references(() => promotions.id),
  metadata: jsonb("metadata"),
});

export const posRegistrationCodes = pgTable("pos_registration_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posDevices = pgTable("pos_devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  assignedUserId: text("assigned_user_id"),
  active: integer("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posSessions = pgTable("pos_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  openingBalance: decimal("opening_balance").notNull(),
  closingBalance: decimal("closing_balance"),
  actualCash: decimal("actual_cash"),
  status: text("status", { enum: ["open", "closed"] }).default("open").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  notes: text("notes"),
});

export const posPettyCash = pgTable("pos_petty_cash", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => posSessions.id).notNull(),
  amount: decimal("amount").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["in", "out"] }).default("out").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPosPettyCashSchema = createInsertSchema(posPettyCash).omit({
  id: true,
  createdAt: true,
});
export type PosPettyCash = typeof posPettyCash.$inferSelect;
export type InsertPosPettyCash = z.infer<typeof insertPosPettyCashSchema>;

export const posPendingSales = pgTable("pos_pending_sales", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => posSessions.id).notNull(),
  cartData: text("cart_data").notNull(), // JSON string
  customerName: text("customer_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["fixed", "percentage"] }).notNull(),
  value: decimal("value").notNull(),
  minPurchase: decimal("min_purchase").default(0).notNull(),
  maxUses: integer("max_uses").default(1).notNull(), // To prevent infinite loop, default 1 time use
  usedCount: integer("used_count").default(0).notNull(),
  expiryDate: timestamp("expiry_date"),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerLoyaltyLedger = pgTable("customer_loyalty_ledger", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  pointsDelta: integer("points_delta").notNull(),
  action: text("action", { enum: ["earned", "spent", "voided", "adjustment"] }).notNull(),
  saleId: integer("sale_id").references(() => sales.id),
  note: text("note"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").default("Kazana Shop").notNull(),
  storeAddress: text("store_address"),
  storePhone: text("store_phone"),
  storeEmail: text("store_email"),
  picName: text("pic_name"),
  storeLogo: text("store_logo"),
  storeProvince: text("store_province"),
  storeCity: text("store_city"),
  storeDistrict: text("store_district"),
  storePostalCode: text("store_postal_code"),
  storeNpwp: text("store_npwp"),
  storeWebsite: text("store_website"),
  storeType: text("store_type"),
  userId: text("user_id").notNull(),
  
  // New Professional Fields
  currency: text("currency").default("IDR").notNull(),
  timezone: text("timezone").default("Asia/Jakarta").notNull(),
  bankName: text("bank_name"),
  bankAccountNo: text("bank_account_no"),
  bankAccountName: text("bank_account_name"),
  taxStatus: text("tax_status").default("Non-PKP"), // PKP, Non-PKP
  businessDescription: text("business_description"),
  
  fastMovingThreshold: integer("fast_moving_threshold").default(30).notNull(),
  slowMovingThreshold: integer("slow_moving_threshold").default(60).notNull(),
  hideBranding: integer("hide_branding").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// === Accounting (Double-Entry & Assets) ===

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["asset", "liability", "equity", "income", "expense"] }).notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalItems = pgTable("journal_items", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  branchId: integer("branch_id").references(() => branches.id), // For Branch-specific Balance Sheets
  debit: decimal("debit").default(0).notNull(),
  credit: decimal("credit").default(0).notNull(),
  userId: text("user_id").notNull(),
});

export const fixedAssets = pgTable("fixed_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  purchasePrice: decimal("purchase_price").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  usefulLifeMonths: integer("useful_life_months").notNull(),
  salvageValue: decimal("salvage_value").default(0).notNull(),
  depreciationMethod: text("depreciation_method").default("straight_line").notNull(),
  assetAccountId: integer("asset_account_id").references(() => accounts.id),
  expenseAccountId: integer("expense_account_id").references(() => accounts.id),
  accumDeprAccountId: integer("accum_depr_account_id").references(() => accounts.id),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// === Phase 9: Stock Transfers ===
export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  fromBranchId: integer("from_branch_id").references(() => branches.id),
  toBranchId: integer("to_branch_id").references(() => branches.id),
  outboundSessionId: integer("outbound_sessions_id").references(() => outboundSessions.id),
  inboundSessionId: integer("inbound_sessions_id").references(() => inboundSessions.id),
  status: text("status", { enum: ["draft", "in_transit", "received", "cancelled"] }).default("draft").notNull(),
  transferredBy: text("transferred_by").notNull(),
  driverName: text("driver_name"),
  receivedBy: text("received_by"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  receivedAt: timestamp("received_at"),
});

export const stockTransferItems = pgTable("stock_transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").references(() => stockTransfers.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  quantity: decimal("quantity").notNull(),
  receivedQuantity: decimal("received_quantity"),
  notes: text("notes"),
});

// === Phase 11: Purchase Orders (Procurement) ===
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").unique().notNull(),
  supplierName: text("supplier_name").notNull(), // Legacy / fallback
  supplierId: integer("supplier_id").references(() => suppliers.id),
  expectedDate: timestamp("expected_date"),
  status: text("status", { enum: ["draft", "sent", "partial", "completed", "cancelled"] }).default("draft").notNull(),
  totalAmount: decimal("total_amount").notNull(),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").references(() => purchaseOrders.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").default(0).notNull(),
  unitPrice: decimal("unit_price").notNull(),
});

// === Phase 16: RMA & Sales Returns ===
export const salesReturns = pgTable("sales_returns", {
  id: serial("id").primaryKey(),
  returnNumber: text("return_number").unique().notNull(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "completed"] }).default("pending").notNull(),
  refundAmount: decimal("refund_amount").notNull(),
  refundMethod: text("refund_method"), // cash, credit_note, original_payment
  notes: text("notes"),
  userId: text("user_id").notNull(), // Admin/Staff processing the return
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salesReturnItems = pgTable("sales_return_items", {
  id: serial("id").primaryKey(),
  returnId: integer("return_id").references(() => salesReturns.id, { onDelete: "cascade" }).notNull(),
  saleItemId: integer("sale_item_id").references(() => saleItems.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityReturned: integer("quantity_returned").notNull(),
  restockStatus: text("restock_status", { enum: ["pending", "restocked", "disposed"] }).default("pending").notNull(),
});

// === Business Verticals (Laundry, Restaurants, Barbershop) ===

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  staffId: integer("staff_id").references(() => staffMembers.id), // Stylist / Service Provider
  storeId: text("store_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).default("pending").notNull(),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restaurantTables = pgTable("restaurant_tables", {
  id: serial("id").primaryKey(),
  storeId: text("store_id").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  tableNumber: text("table_number").notNull(),
  capacity: integer("capacity").default(2),
  status: text("status", { enum: ["available", "occupied", "reserved", "cleaning"] }).default("available").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderStatusLogs = pgTable("order_status_logs", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(), // Unified order ID for Laundry / Sales
  statusName: text("status_name").notNull(), // misal: 'Wash', 'Dry', 'Iron', 'Ready'
  notes: text("notes"),
  branchId: integer("branch_id").references(() => branches.id),
  userId: text("user_id").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productModifiers = pgTable("product_modifiers", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: decimal("price").default(0).notNull(),
  type: text("type", { enum: ["extra", "option"] }).default("extra").notNull(),
  isAvailable: integer("is_available").default(1).notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Schema Insert Definitions ===

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertRestaurantTableSchema = createInsertSchema(restaurantTables).omit({ id: true, createdAt: true });
export const insertOrderStatusLogSchema = createInsertSchema(orderStatusLogs).omit({ id: true, createdAt: true });
export const insertProductModifierSchema = createInsertSchema(productModifiers).omit({ id: true, createdAt: true });

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type RestaurantTable = typeof restaurantTables.$inferSelect;
export type InsertRestaurantTable = z.infer<typeof insertRestaurantTableSchema>;
export type OrderStatusLog = typeof orderStatusLogs.$inferSelect;
export type InsertOrderStatusLog = z.infer<typeof insertOrderStatusLogSchema>;
export type ProductModifier = typeof productModifiers.$inferSelect;
export type InsertProductModifier = z.infer<typeof insertProductModifierSchema>;

// === Relations ===

export const productPhotosRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, {
    fields: [productPhotos.productId],
    references: [products.id],
  }),
}));

export const productUnitsRelations = relations(productUnits, ({ one }) => ({
  product: one(products, {
    fields: [productUnits.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  photos: many(productPhotos),
  units: many(productUnits),
}));

export const opnameRecordsRelations = relations(opnameRecords, ({ one, many }) => ({
  session: one(opnameSessions, {
    fields: [opnameRecords.sessionId],
    references: [opnameSessions.id],
  }),
  product: one(products, {
    fields: [opnameRecords.productId],
    references: [products.id],
  }),
  photos: many(opnameRecordPhotos),
}));

export const opnameRecordPhotosRelations = relations(opnameRecordPhotos, ({ one }) => ({
  record: one(opnameRecords, {
    fields: [opnameRecordPhotos.recordId],
    references: [opnameRecords.id],
  }),
}));

export const opnameSessionsRelations = relations(opnameSessions, ({ many }) => ({
  records: many(opnameRecords),
}));

export const inboundSessionsRelations = relations(inboundSessions, ({ many }) => ({
  items: many(inboundItems),
}));

export const inboundItemsRelations = relations(inboundItems, ({ one, many }) => ({
  session: one(inboundSessions, {
    fields: [inboundItems.sessionId],
    references: [inboundSessions.id],
  }),
  product: one(products, {
    fields: [inboundItems.productId],
    references: [products.id],
  }),
  photos: many(inboundItemPhotos),
}));

export const inboundItemPhotosRelations = relations(inboundItemPhotos, ({ one }) => ({
  item: one(inboundItems, {
    fields: [inboundItemPhotos.itemId],
    references: [inboundItems.id],
  }),
}));

export const outboundSessionsRelations = relations(outboundSessions, ({ one, many }) => ({
  items: many(outboundItems),
  toBranch: one(branches, {
    fields: [outboundSessions.toBranchId],
    references: [branches.id],
  }),
}));

export const outboundItemsRelations = relations(outboundItems, ({ one, many }) => ({
  session: one(outboundSessions, {
    fields: [outboundItems.sessionId],
    references: [outboundSessions.id],
  }),
  product: one(products, {
    fields: [outboundItems.productId],
    references: [products.id],
  }),
  photos: many(outboundItemPhotos),
}));

export const outboundItemPhotosRelations = relations(outboundItemPhotos, ({ one }) => ({
  item: one(outboundItems, {
    fields: [outboundItemPhotos.itemId],
    references: [outboundItems.id],
  }),
}));

export const bomsRelations = relations(boms, ({ one, many }) => ({
  targetProduct: one(products, {
    fields: [boms.targetProductId],
    references: [products.id],
  }),
  items: many(bomItems),
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  bom: one(boms, {
    fields: [bomItems.bomId],
    references: [boms.id],
  }),
  product: one(products, {
    fields: [bomItems.productId],
    references: [products.id],
  }),
}));

export const assemblySessionsRelations = relations(assemblySessions, ({ one }) => ({
  bom: one(boms, {
    fields: [assemblySessions.bomId],
    references: [boms.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  salesperson: one(users, {
    fields: [sales.salespersonId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [sales.branchId],
    references: [branches.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  items: many(purchaseOrderItems),
  branch: one(branches, {
    fields: [purchaseOrders.branchId],
    references: [branches.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  po: one(purchaseOrders, {
    fields: [purchaseOrderItems.poId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export const salesReturnsRelations = relations(salesReturns, ({ one, many }) => ({
  sale: one(sales, {
    fields: [salesReturns.saleId],
    references: [sales.id],
  }),
  items: many(salesReturnItems),
}));

export const salesReturnItemsRelations = relations(salesReturnItems, ({ one }) => ({
  return: one(salesReturns, {
    fields: [salesReturnItems.returnId],
    references: [salesReturns.id],
  }),
  product: one(products, {
    fields: [salesReturnItems.productId],
    references: [products.id],
  }),
  saleItem: one(saleItems, {
    fields: [salesReturnItems.saleItemId],
    references: [saleItems.id],
  }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
  items: many(stockTransferItems),
  fromBranch: one(branches, {
    fields: [stockTransfers.fromBranchId],
    references: [branches.id],
  }),
  toBranch: one(branches, {
    fields: [stockTransfers.toBranchId],
    references: [branches.id],
  }),
}));

export const stockTransferItemsRelations = relations(stockTransferItems, ({ one }) => ({
  transfer: one(stockTransfers, {
    fields: [stockTransferItems.transferId],
    references: [stockTransfers.id],
  }),
  product: one(products, {
    fields: [stockTransferItems.productId],
    references: [products.id],
  }),
}));

export const posDevicesRelations = relations(posDevices, ({ one }) => ({
  assignedUser: one(users, {
    fields: [posDevices.assignedUserId],
    references: [users.id],
  }),
}));

export const customerLoyaltyLedgerRelations = relations(customerLoyaltyLedger, ({ one }) => ({
  sale: one(sales, {
    fields: [customerLoyaltyLedger.saleId],
    references: [sales.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  staff: one(staffMembers, { fields: [appointments.staffId], references: [staffMembers.id] }),
  branch: one(branches, { fields: [appointments.branchId], references: [branches.id] }),
}));

export const restaurantTablesRelations = relations(restaurantTables, ({ one }) => ({
  branch: one(branches, { fields: [restaurantTables.branchId], references: [branches.id] }),
}));

export const productModifiersRelations = relations(productModifiers, ({ one }) => ({
  product: one(products, { fields: [productModifiers.productId], references: [products.id] }),
}));

export const orderStatusLogsRelations = relations(orderStatusLogs, ({ one }) => ({
  branch: one(branches, { fields: [orderStatusLogs.branchId], references: [branches.id] }),
}));

// === Insert Schemas ===

export const insertProductSchema = createInsertSchema(products).omit({ id: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(opnameSessions).omit({ id: true, startedAt: true, completedAt: true });
export const insertRecordSchema = createInsertSchema(opnameRecords).omit({ id: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });
export const insertModuleSubscriptionSchema = createInsertSchema(moduleSubscriptions).omit({ id: true, createdAt: true, paidAt: true });
export const insertProductPhotoSchema = createInsertSchema(productPhotos).omit({ id: true, createdAt: true });
export const insertProductUnitSchema = createInsertSchema(productUnits).omit({ id: true });
export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({ id: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });
export const insertMotivationMessageSchema = createInsertSchema(motivationMessages).omit({ id: true });
export const insertCategoryPrioritySchema = createInsertSchema(categoryPriorities).omit({ id: true });
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export const insertInboundSessionSchema = createInsertSchema(inboundSessions).omit({ id: true, startedAt: true, completedAt: true });
export const insertInboundItemSchema = createInsertSchema(inboundItems).omit({ id: true });
export const insertOutboundSessionSchema = createInsertSchema(outboundSessions).omit({ id: true, startedAt: true, shippedAt: true, receivedAt: true });
export const insertOutboundItemSchema = createInsertSchema(outboundItems).omit({ id: true });
export const insertBomSchema = createInsertSchema(boms).omit({ id: true });
export const insertBomItemSchema = createInsertSchema(bomItems).omit({ id: true });
export const insertAssemblySessionSchema = createInsertSchema(assemblySessions).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export const insertJournalItemSchema = createInsertSchema(journalItems).omit({ id: true });
export const insertFixedAssetSchema = createInsertSchema(fixedAssets).omit({ id: true, createdAt: true });
export const insertPosDeviceSchema = createInsertSchema(posDevices).omit({ id: true, createdAt: true });
export const insertPosRegistrationCodeSchema = createInsertSchema(posRegistrationCodes).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true });
export const insertPosSessionSchema = createInsertSchema(posSessions).omit({ id: true });
export const insertPosPendingSaleSchema = createInsertSchema(posPendingSales).omit({ id: true, createdAt: true });
export const insertTieredPricingSchema = createInsertSchema(tieredPricing).omit({ id: true });
export const insertProductBundleSchema = createInsertSchema(productBundles).omit({ id: true });
export const insertVoucherSchema = createInsertSchema(vouchers).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertCustomerLoyaltyLedgerSchema = createInsertSchema(customerLoyaltyLedger).omit({ id: true, createdAt: true });
export const insertStockTransferSchema = createInsertSchema(stockTransfers).omit({ id: true, createdAt: true });
export const insertStockTransferItemSchema = createInsertSchema(stockTransferItems).omit({ id: true });
export const insertSalesReturnSchema = createInsertSchema(salesReturns).omit({ id: true, createdAt: true });
export const insertSalesReturnItemSchema = createInsertSchema(salesReturnItems).omit({ id: true });




// === Types ===

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductPhoto = typeof productPhotos.$inferSelect;
export type InsertProductPhoto = z.infer<typeof insertProductPhotoSchema>;
export type ProductUnit = typeof productUnits.$inferSelect;
export type InsertProductUnit = z.infer<typeof insertProductUnitSchema>;
export type OpnameSession = typeof opnameSessions.$inferSelect;
export type InsertOpnameSession = z.infer<typeof insertSessionSchema>;
export type OpnameRecord = typeof opnameRecords.$inferSelect;
export type InsertOpnameRecord = z.infer<typeof insertRecordSchema>;
export type OpnameRecordPhoto = typeof opnameRecordPhotos.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type ModuleSubscription = typeof moduleSubscriptions.$inferSelect;
export type InsertModuleSubscription = z.infer<typeof insertModuleSubscriptionSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type MotivationMessage = typeof motivationMessages.$inferSelect;
export type InsertMotivationMessage = z.infer<typeof insertMotivationMessageSchema>;
export type CategoryPriority = typeof categoryPriorities.$inferSelect;
export type InsertCategoryPriority = z.infer<typeof insertCategoryPrioritySchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type InboundSession = typeof inboundSessions.$inferSelect;
export type InsertInboundSession = z.infer<typeof insertInboundSessionSchema>;
export type InboundItem = typeof inboundItems.$inferSelect;
export type InsertInboundItem = z.infer<typeof insertInboundItemSchema>;
export type OutboundSession = typeof outboundSessions.$inferSelect;
export type InsertOutboundSession = z.infer<typeof insertOutboundSessionSchema>;
export type OutboundItem = typeof outboundItems.$inferSelect;
export type InsertOutboundItem = z.infer<typeof insertOutboundItemSchema>;
export type Bom = typeof boms.$inferSelect;
export type InsertBom = z.infer<typeof insertBomSchema>;
export type BomItem = typeof bomItems.$inferSelect;
export type InsertBomItem = z.infer<typeof insertBomItemSchema>;
export type AssemblySession = typeof assemblySessions.$inferSelect;
export type InsertAssemblySession = z.infer<typeof insertAssemblySessionSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalItem = typeof journalItems.$inferSelect;
export type InsertJournalItem = z.infer<typeof insertJournalItemSchema>;
export type FixedAsset = typeof fixedAssets.$inferSelect;
export type InsertFixedAsset = z.infer<typeof insertFixedAssetSchema>;
export type PosDevice = typeof posDevices.$inferSelect;
export type InsertPosDevice = z.infer<typeof insertPosDeviceSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type PosSession = typeof posSessions.$inferSelect;
export type InsertPosSession = z.infer<typeof insertPosSessionSchema>;
export type PosPendingSale = typeof posPendingSales.$inferSelect;
export type InsertPosPendingSale = z.infer<typeof insertPosPendingSaleSchema>;
export type TieredPricing = typeof tieredPricing.$inferSelect;
export type InsertTieredPricing = z.infer<typeof insertTieredPricingSchema>;
export type ProductBundle = typeof productBundles.$inferSelect;
export type InsertProductBundle = z.infer<typeof insertProductBundleSchema>;
export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type CustomerLoyaltyLedger = typeof customerLoyaltyLedger.$inferSelect;
export type InsertCustomerLoyaltyLedger = z.infer<typeof insertCustomerLoyaltyLedgerSchema>;

export type InsertPosRegistrationCode = typeof posRegistrationCodes.$inferInsert;
export type StockTransferItem = typeof stockTransferItems.$inferSelect;
export type InboundItemPhoto = typeof inboundItemPhotos.$inferSelect;
export type OutboundItemPhoto = typeof outboundItemPhotos.$inferSelect;
export type StockTransfer = typeof stockTransfers.$inferSelect;
export type InsertStockTransfer = z.infer<typeof insertStockTransferSchema>;
export type InsertStockTransferItem = z.infer<typeof insertStockTransferItemSchema>;
export type SalesReturn = typeof salesReturns.$inferSelect;
export type InsertSalesReturn = z.infer<typeof insertSalesReturnSchema>;
export type SalesReturnItem = typeof salesReturnItems.$inferSelect;
export type InsertSalesReturnItem = z.infer<typeof insertSalesReturnItemSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type ProductWithPhotosAndUnits = Product & { photos: ProductPhoto[]; units: ProductUnit[] };
export type OpnameRecordWithProduct = OpnameRecord & { product: Product & { photos: ProductPhoto[]; units: ProductUnit[] }; photos: OpnameRecordPhoto[] };
export type OpnameSessionWithRecords = OpnameSession & { records: OpnameRecordWithProduct[] };
export type InboundSessionWithItems = InboundSession & { items: (InboundItem & { product: Product; photos: any[] })[] };
export type OutboundSessionWithItems = OutboundSession & { items: (OutboundItem & { product: Product; photos: any[] })[]; toBranch: Branch | null };
export type StockTransferWithItems = StockTransfer & {
  items: (StockTransferItem & { product: Product })[];
  fromBranch: Branch | null;
  toBranch: Branch | null
};
export type BomWithItems = Bom & { items: (BomItem & { product: Product })[]; targetProduct: Product };
export type SaleWithItems = Sale & {
  items: (SaleItem & { product: Product })[];
  customer: Customer | null;
  salesperson?: User | null;
  salespersonName?: string;
};
export type AssemblySessionWithBOM = AssemblySession & { bom: Bom & { targetProduct: Product } };



