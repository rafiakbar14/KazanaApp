import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role", { enum: ["admin", "driver", "sku_manager", "stock_counter", "stock_counter_toko", "stock_counter_gudang"] }).default("stock_counter").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  subCategory: text("sub_category"),
  productCode: text("product_code"),
  description: text("description"),
  currentStock: integer("current_stock").default(0).notNull(),
  unitCost: real("unit_cost").default(0),
  sellingPrice: real("selling_price").default(0),
  photoUrl: text("photo_url"),
  userId: text("user_id").notNull(),
  locationType: text("location_type", { enum: ["toko", "gudang"] }).default("toko"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  conversionToBase: real("conversion_to_base").default(1).notNull(),
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
});

export const opnameRecords = pgTable("opname_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => opnameSessions.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
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
  active: integer("active").default(1).notNull(),
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
  senderName: text("sender_name"),
  receiverName: text("receiver_name"),
  senderSignature: text("sender_signature"),
  receiverSignature: text("receiver_signature"),
});

export const inboundItems = pgTable("inbound_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => inboundSessions.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityReceived: integer("quantity_received").notNull(),
  notes: text("notes"),
});

export const inboundItemPhotos = pgTable("inbound_item_photos", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inboundItems.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Outbound (Barang Keluar / Transfer) ===
export const outboundSessions = pgTable("outbound_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["draft", "shipped", "received"] }).default("draft").notNull(),
  toBranchId: integer("to_branch_id").references(() => branches.id),
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
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityShipped: integer("quantity_shipped").notNull(),
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
  targetProductId: integer("target_product_id").references(() => products.id).notNull(),
  name: text("name").notNull(),
  version: text("version").default("1.0"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  active: integer("active").default(1).notNull(),
});

export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => boms.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityNeeded: real("quantity_needed").notNull(),
});

export const assemblySessions = pgTable("assembly_sessions", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").references(() => boms.id).notNull(),
  quantityProduced: integer("quantity_produced").notNull(),
  totalCost: real("total_cost"),
  notes: text("notes"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const staffMembersRelations = relations(staffMembers, ({ }) => ({}));

export const branchesRelations = relations(branches, ({ many }) => ({
  transfers: many(outboundSessions),
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

// === Insert Schemas ===

export const insertProductSchema = createInsertSchema(products).omit({ id: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(opnameSessions).omit({ id: true, startedAt: true, completedAt: true });
export const insertRecordSchema = createInsertSchema(opnameRecords).omit({ id: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });
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

export type ProductWithPhotosAndUnits = Product & { photos: ProductPhoto[]; units: ProductUnit[] };
export type OpnameRecordWithProduct = OpnameRecord & { product: Product & { photos: ProductPhoto[]; units: ProductUnit[] }; photos: OpnameRecordPhoto[] };
export type OpnameSessionWithRecords = OpnameSession & { records: OpnameRecordWithProduct[] };
export type InboundSessionWithItems = InboundSession & { items: (InboundItem & { product: Product; photos: any[] })[] };
export type OutboundSessionWithItems = OutboundSession & { items: (OutboundItem & { product: Product; photos: any[] })[]; toBranch: Branch | null };
