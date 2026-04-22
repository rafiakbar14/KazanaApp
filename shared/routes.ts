import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  products,
  opnameSessions,
  opnameRecords,
  userRoles,
  inboundItems,
  outboundItems,
  insertProductSchema,
  insertSessionSchema,
  insertInboundSessionSchema,
  insertInboundItemSchema,
  insertOutboundSessionSchema,
  insertOutboundItemSchema,
  insertBomSchema,
  insertBomItemSchema,
  insertAssemblySessionSchema,
  insertCustomerSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  boms,
  bomItems,
  assemblySessions,
  insertUserRoleSchema,
  insertProductPhotoSchema,
  insertProductUnitSchema,
  insertPosDeviceSchema,
  insertTieredPricingSchema,
  insertProductBundleSchema,
  insertCategorySchema,
  insertUnitSchema,
  insertSalesReturnSchema,
  insertSalesReturnItemSchema,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: "GET" as const,
      path: "/api/products" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/products" as const,
      input: insertProductSchema.omit({ userId: true }),
    },
    update: {
      method: "PUT" as const,
      path: "/api/products/:id" as const,
      input: insertProductSchema.omit({ userId: true }).partial(),
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/products/:id" as const,
    },
    bulkDelete: {
      method: "POST" as const,
      path: "/api/products/bulk-delete" as const,
    },
    bulkResetStock: {
      method: "POST" as const,
      path: "/api/products/bulk-reset-stock" as const,
    },
    categories: {
      method: "GET" as const,
      path: "/api/products/categories" as const,
    },
    withDetails: {
      method: "GET" as const,
      path: "/api/products/with-details" as const,
    },
  },
  productPhotos: {
    list: {
      method: "GET" as const,
      path: "/api/products/:productId/photos" as const,
    },
    upload: {
      method: "POST" as const,
      path: "/api/products/:productId/photos" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/products/:productId/photos/:photoId" as const,
    },
  },
  productUnits: {
    list: {
      method: "GET" as const,
      path: "/api/products/:productId/units" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/products/:productId/units" as const,
    },
    update: {
      method: "PUT" as const,
      path: "/api/products/:productId/units/:unitId" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/products/:productId/units/:unitId" as const,
    },
  },
  sessions: {
    list: {
      method: "GET" as const,
      path: "/api/sessions" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/sessions" as const,
      input: insertSessionSchema.omit({ userId: true }),
    },
    get: {
      method: "GET" as const,
      path: "/api/sessions/:id" as const,
    },
    complete: {
      method: "POST" as const,
      path: "/api/sessions/:id/complete" as const,
    },
    backup: {
      method: "POST" as const,
      path: "/api/sessions/:id/backup" as const,
    },
    verifyBackup: {
      method: "POST" as const,
      path: "/api/sessions/:id/verify-backup" as const,
    },
  },
  records: {
    update: {
      method: "POST" as const,
      path: "/api/sessions/:sessionId/records" as const,
      input: z.object({
        productId: z.number(),
        actualStock: z.number(),
        notes: z.string().optional(),
        unitValues: z.string().optional(),
      }),
    },
  },
  recordPhotos: {
    upload: {
      method: "POST" as const,
      path: "/api/sessions/:sessionId/records/:productId/photos" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/sessions/:sessionId/records/:productId/photos/:photoId" as const,
    },
  },
  roles: {
    me: {
      method: "GET" as const,
      path: "/api/roles/me" as const,
    },
    list: {
      method: "GET" as const,
      path: "/api/roles" as const,
    },
    set: {
      method: "POST" as const,
      path: "/api/roles" as const,
      input: z.object({
        userId: z.string(),
        role: z.enum([
          "admin",
          "sku_manager",
          "stock_counter",
          "stock_counter_toko",
          "stock_counter_gudang",
        ]),
      }),
    },
  },
  upload: {
    photo: {
      method: "POST" as const,
      path: "/api/upload/photo/:productId" as const,
    },
    opnamePhoto: {
      method: "POST" as const,
      path: "/api/upload/opname-photo/:sessionId/:productId" as const,
    },
    downloadZip: {
      method: "POST" as const,
      path: "/api/sessions/:id/download-photos" as const,
    },
    storeLogo: {
      method: "POST" as const,
      path: "/api/upload/store-logo" as const,
    },
  },
  excel: {
    template: {
      method: "GET" as const,
      path: "/api/excel/template" as const,
    },
    import: {
      method: "POST" as const,
      path: "/api/excel/import" as const,
    },
    export: {
      method: "GET" as const,
      path: "/api/excel/export" as const,
    },
    gudangTemplate: {
      method: "POST" as const,
      path: "/api/excel/gudang-template" as const,
    },
    gudangExport: {
      method: "POST" as const,
      path: "/api/excel/gudang-export" as const,
    },
    gudangImport: {
      method: "POST" as const,
      path: "/api/excel/gudang-import" as const,
    },
  },
  staff: {
    list: {
      method: "GET" as const,
      path: "/api/staff" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/staff" as const,
    },
    update: {
      method: "PUT" as const,
      path: "/api/staff/:id" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/staff/:id" as const,
    },
  },
  announcements: {
    list: {
      method: "GET" as const,
      path: "/api/announcements" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/announcements" as const,
    },
    update: {
      method: "PUT" as const,
      path: "/api/announcements/:id" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/announcements/:id" as const,
    },
    uploadImage: {
      method: "POST" as const,
      path: "/api/announcements/:id/image" as const,
    },
  },
  feedback: {
    list: {
      method: "GET" as const,
      path: "/api/feedback" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/feedback" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/feedback/:id" as const,
    },
  },
  motivation: {
    list: {
      method: "GET" as const,
      path: "/api/motivation" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/motivation" as const,
    },
    update: {
      method: "PUT" as const,
      path: "/api/motivation/:id" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/motivation/:id" as const,
    },
  },
  categoryPriorities: {
    list: {
      method: "GET" as const,
      path: "/api/category-priorities" as const,
    },
    set: {
      method: "POST" as const,
      path: "/api/category-priorities" as const,
    },
  },
  inbound: {
    list: {
      method: "GET" as const,
      path: "/api/inbound" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/inbound" as const,
      input: insertInboundSessionSchema.omit({ userId: true }),
    },
    get: {
      method: "GET" as const,
      path: "/api/inbound/:id" as const,
    },
    complete: {
      method: "POST" as const,
      path: "/api/inbound/:id/complete" as const,
    },
    addItem: {
      method: "POST" as const,
      path: "/api/inbound/:sessionId/items" as const,
      input: createInsertSchema(inboundItems).omit({
        id: true,
        sessionId: true,
      }).extend({
        expiryDate: z.coerce.date().nullable().optional(),
      }),
    },
    removeItem: {
      method: "DELETE" as const,
      path: "/api/inbound/:sessionId/items/:itemId" as const,
    },
    uploadPhoto: {
      method: "POST" as const,
      path: "/api/inbound/:sessionId/items/:itemId/photos" as const,
    },
    deletePhoto: {
      method: "DELETE" as const,
      path: "/api/inbound/:sessionId/items/:itemId/photos/:photoId" as const,
    },
    saveSignatures: {
      method: "POST" as const,
      path: "/api/inbound/:id/signatures" as const,
      input: z.object({
        senderName: z.string().optional(),
        receiverName: z.string().optional(),
        senderSignature: z.string().optional(),
        receiverSignature: z.string().optional(),
      }),
    },
  },
  branches: {
    list: {
      method: "GET" as const,
      path: "/api/branches" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/branches" as const,
    },
    update: {
      method: "PUT" as const,
      path: "/api/branches/:id" as const,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/branches/:id" as const,
    },
  },
  transfers: {
    list: {
      method: "GET" as const,
      path: "/api/transfers" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/transfers" as const,
    },
    get: {
      method: "GET" as const,
      path: "/api/transfers/:id" as const,
    },
    receive: {
      method: "POST" as const,
      path: "/api/transfers/:id/receive" as const,
    },
    cancel: {
      method: "POST" as const,
      path: "/api/transfers/:id/cancel" as const,
    },
  },
  outbound: {
    list: {
      method: "GET" as const,
      path: "/api/outbound" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/outbound" as const,
      input: insertOutboundSessionSchema.omit({ userId: true }),
    },
    get: {
      method: "GET" as const,
      path: "/api/outbound/:id" as const,
    },
    complete: {
      method: "POST" as const,
      path: "/api/outbound/:id/complete" as const,
    },
    addItem: {
      method: "POST" as const,
      path: "/api/outbound/:sessionId/items" as const,
      input: createInsertSchema(outboundItems).omit({
        id: true,
        sessionId: true,
      }),
    },
    removeItem: {
      method: "DELETE" as const,
      path: "/api/outbound/:sessionId/items/:itemId" as const,
    },
    uploadPhoto: {
      method: "POST" as const,
      path: "/api/outbound/:sessionId/items/:itemId/photos" as const,
    },
    deletePhoto: {
      method: "DELETE" as const,
      path: "/api/outbound/:sessionId/items/:itemId/photos/:photoId" as const,
    },
      saveSignatures: {
        method: "POST" as const,
        path: "/api/outbound/:id/signatures" as const,
        input: z.object({
          senderName: z.string().optional(),
          driverName: z.string().optional(),
          receiverName: z.string().optional(),
          senderSignature: z.string().optional(),
          driverSignature: z.string().optional(),
          receiverSignature: z.string().optional(),
        }),
      },
    },
    crm: {
    customers: {
      listWithStats: {
        method: "GET" as const,
        path: "/api/crm/customers" as const,
      },
      loyaltyHistory: {
        method: "GET" as const,
        path: "/api/crm/customers/:id/loyalty-history" as const,
      },
    },
  },
  production: {
    predict: {
      method: "POST" as const,
      path: "/api/production/predict" as const,
    },
    boms: {
      list: {
        method: "GET" as const,
        path: "/api/boms" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/boms" as const,
        input: insertBomSchema.omit({ userId: true }),
      },
      get: {
        method: "GET" as const,
        path: "/api/boms/:id" as const,
      },
      addItem: {
        method: "POST" as const,
        path: "/api/boms/:bomId/items" as const,
        input: insertBomItemSchema.omit({ bomId: true }),
      },
      removeItem: {
        method: "DELETE" as const,
        path: "/api/boms/:bomId/items/:itemId" as const,
      },
    },
    sessions: {
      list: {
        method: "GET" as const,
        path: "/api/assembly" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/assembly" as const,
        input: insertAssemblySessionSchema.omit({ userId: true }),
      },
      get: {
        method: "GET" as const,
        path: "/api/assembly/:id" as const,
      },
      complete: {
        method: "POST" as const,
        path: "/api/assembly/:id/complete" as const,
      },
    },
  },
  pos: {
    sales: {
      list: {
        method: "GET" as const,
        path: "/api/sales" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/sales" as const,
      },
      get: {
        method: "GET" as const,
        path: "/api/sales/:id" as const,
      },
      returns: {
        list: {
          method: "GET" as const,
          path: "/api/sales/returns" as const,
        },
        create: {
          method: "POST" as const,
          path: "/api/sales/returns" as const,
          input: insertSalesReturnSchema.omit({ userId: true, createdAt: true }).extend({
            items: z.array(insertSalesReturnItemSchema.omit({ returnId: true }))
          }),
        },
        complete: {
          method: "POST" as const,
          path: "/api/sales/returns/:id/complete" as const,
        }
      }
    },
    updatePin: {
      method: "POST" as const,
      path: "/api/user/pin" as const,
      input: z.object({
        pin: z.string().length(6),
      }),
    },
    adminUpdatePin: {
      method: "POST" as const,
      path: "/api/admin/user/pin" as const,
      input: z.object({
        userId: z.string(),
        pin: z.string().length(6),
      }),
    },
    verifyPin: {
      method: "POST" as const,
      path: "/api/user/pin/verify" as const,
      input: z.object({
        pin: z.string().length(6),
      }),
    },
    customers: {
      list: {
        method: "GET" as const,
        path: "/api/customers" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/customers" as const,
        input: insertCustomerSchema.omit({ userId: true }),
      },
    },
    devices: {
      list: {
        method: "GET" as const,
        path: "/api/pos/devices" as const,
      },
      register: {
        method: "POST" as const,
        path: "/api/pos/devices/register" as const,
        input: z.object({
          deviceId: z.string(),
          name: z.string(),
          registrationCode: z.string().length(6),
        }),
      },
      verify: {
        method: "POST" as const,
        path: "/api/pos/devices/verify" as const,
        input: z.object({
          deviceId: z.string(),
          pin: z.string().length(6),
        }),
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/pos/devices/:id" as const,
      },
      assign: {
        method: "PATCH" as const,
        path: "/api/pos/devices/:deviceId/assign" as const,
      },
      registrationCodes: {
        list: {
          method: "GET" as const,
          path: "/api/pos/registration-codes" as const,
        },
        generate: {
          method: "POST" as const,
          path: "/api/pos/registration-codes" as const,
        },
      },
    },
    promotions: {
      list: {
        method: "GET" as const,
        path: "/api/pos/promotions" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/pos/promotions" as const,
        input: z.object({
          name: z.string(),
          type: z.enum(["fixed", "percentage"]),
          value: z.number(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          daysOfWeek: z.string().optional(),
          productId: z.number().optional(),
        }),
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/pos/promotions/:id" as const,
      },
    },
    sessions: {
      active: {
        method: "GET" as const,
        path: "/api/pos/sessions/active" as const,
      },
      start: {
        method: "POST" as const,
        path: "/api/pos/sessions/start" as const,
        input: z.object({
          openingBalance: z.number(),
          notes: z.string().optional(),
        }),
      },
      close: {
        method: "POST" as const,
        path: "/api/pos/sessions/close/:id" as const,
        input: z.object({
          closingBalance: z.number(),
          actualCash: z.number(),
          notes: z.string().optional(),
        }),
      },
      pettyCash: {
        list: {
          method: "GET" as const,
          path: "/api/pos/sessions/:id/petty-cash" as const,
        },
      },
      list: {
        method: "GET" as const,
        path: "/api/pos/sessions" as const,
      },
      pendingSales: {
        list: {
          method: "GET" as const,
          path: "/api/pos/sessions/:id/pending-sales" as const,
        },
      },
    },
    pettyCash: {
      create: {
        method: "POST" as const,
        path: "/api/pos/petty-cash" as const,
        input: z.object({
          amount: z.number(),
          description: z.string(),
          type: z.enum(["in", "out"]),
          sessionId: z.number(),
        }),
      },
    },
    pendingSales: {
      save: {
        method: "POST" as const,
        path: "/api/pos/pending-sales" as const,
        input: z.object({
          cartData: z.string(),
          customerName: z.string().optional(),
          sessionId: z.number(),
        }),
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/pos/pending-sales/:id" as const,
      },
    },
    vouchers: {
      list: {
        method: "GET" as const,
        path: "/api/pos/vouchers" as const,
      },
      validate: {
        method: "GET" as const,
        path: "/api/pos/vouchers/validate" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/pos/vouchers" as const,
        input: z.object({
          code: z.string(),
          type: z.enum(["fixed", "percentage"]),
          value: z.number(),
          minPurchase: z.number().optional(),
          expiryDate: z.string().optional(),
        }),
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/pos/vouchers/:id" as const,
      },
    },
  },
  settings: {
    get: {
      method: "GET" as const,
      path: "/api/settings" as const,
    },
    update: {
      method: "PUT" as const,
      path: "/api/settings" as const,
    },
  },
  erp: {
    invoices: {
      list: {
        method: "GET" as const,
        path: "/api/sales/invoices" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/sales/invoices" as const,
        input: insertSaleSchema
          .extend({
            items: z.array(insertSaleItemSchema.omit({ saleId: true })),
          })
          .omit({ userId: true, uuid: true }),
      },
      updateStatus: {
        method: "PATCH" as const,
        path: "/api/sales/invoices/:id/status" as const,
        input: z.object({
          status: z.string(),
        }),
      },
    },
    reports: {
      export: {
        method: "GET" as const,
        path: "/api/reports/export" as const,
      },
    },
  },
  accounting: {
    accounts: {
      list: {
        method: "GET" as const,
        path: "/api/accounting/accounts" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/accounting/accounts" as const,
      },
    },
    journal: {
      list: {
        method: "GET" as const,
        path: "/api/accounting/journal" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/accounting/journal" as const,
      },
    },
    assets: {
      list: {
        method: "GET" as const,
        path: "/api/accounting/assets" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/accounting/assets" as const,
      },
      depreciate: {
        method: "POST" as const,
        path: "/api/accounting/assets/depreciate" as const,
      },
    },
    reports: {
      balanceSheet: {
        method: "GET" as const,
        path: "/api/accounting/reports/balance-sheet" as const,
      },
      profitAndLoss: {
        method: "GET" as const,
        path: "/api/accounting/reports/profit-loss" as const,
      },
    },
  },
  pricing: {
    tiered: {
      list: {
        method: "GET" as const,
        path: "/api/pricing/tiered/:productId" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/pricing/tiered" as const,
        input: insertTieredPricingSchema.omit({ userId: true }),
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/pricing/tiered/:id" as const,
      },
    },
  },
  bundling: {
    list: {
      method: "GET" as const,
      path: "/api/bundling/:parentProductId" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/bundling" as const,
      input: insertProductBundleSchema,
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/bundling/:id" as const,
    },
  },
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/categories" as const,
      input: insertCategorySchema.omit({ userId: true }),
    },
    update: {
      method: "PUT" as const,
      path: "/api/categories/:id" as const,
      input: insertCategorySchema.omit({ userId: true }).partial(),
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/categories/:id" as const,
    },
  },
  units: {
    list: {
      method: "GET" as const,
      path: "/api/units" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/units" as const,
      input: insertUnitSchema.omit({ userId: true }),
    },
    update: {
      method: "PUT" as const,
      path: "/api/units/:id" as const,
      input: insertUnitSchema.omit({ userId: true }).partial(),
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/units/:id" as const,
    },
  },
  inventory: {
    valuation: {
      method: "GET" as const,
      path: "/api/inventory/valuation" as const,
    },
    lots: {
      method: "GET" as const,
      path: "/api/inventory/lots/:productId" as const,
    },
    stockLedger: {
      method: "GET" as const,
      path: "/api/inventory/stock-ledger/:productId" as const,
    },
    consolidatedStock: {
      method: "GET" as const,
      path: "/api/inventory/consolidated-stock/:productId" as const,
    },
  },
  logistics: {
    suggestions: {
      method: "GET" as const,
      path: "/api/logistics/suggestions" as const,
    },
  },
  procurement: {
    suppliers: {
      list: {
        method: "GET" as const,
        path: "/api/procurement/suppliers" as const,
      },
      create: {
        method: "POST" as const,
        path: "/api/procurement/suppliers" as const,
      },
      update: {
        method: "PUT" as const,
        path: "/api/procurement/suppliers/:id" as const,
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/procurement/po" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/procurement/po" as const,
    },
    complete: {
      method: "POST" as const,
      path: "/api/procurement/po/:id/complete" as const,
    },
    approve: {
      method: "POST" as const,
      path: "/api/procurement/po/:id/approve" as const,
    },
  },
  rma: {
    list: {
      method: "GET" as const,
      path: "/api/rma/list" as const,
    },
    create: {
      method: "POST" as const,
      path: "/api/rma/return" as const,
    },
  },
  analytics: {
    inventoryDemand: {
      method: "GET" as const,
      path: "/api/analytics/inventory-demand" as const,
    },
    salesForecast: {
      method: "GET" as const,
      path: "/api/analytics/sales-forecast" as const,
    },
    categoryPerformance: {
      method: "GET" as const,
      path: "/api/analytics/category-performance" as const,
    },
    inventoryAging: {
      method: "GET" as const,
      path: "/api/analytics/inventory-aging" as const,
    },
    aiInsights: {
      method: "GET" as const,
      path: "/api/analytics/ai-insights" as const,
    },
    stockHealth: {
      method: "GET" as const,
      path: "/api/analytics/stock-health" as const,
    },
  },
  alerts: {
    expiringSoon: {
      method: "GET" as const,
      path: "/api/alerts/expiring-soon" as const,
    },
  },
  backup: {
    stats: {
      method: "GET" as const,
      path: "/api/backup/stats" as const,
    },
    run: {
      method: "POST" as const,
      path: "/api/backup/run" as const,
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
