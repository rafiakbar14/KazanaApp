
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./shared/schema";
import bcrypt from "bcryptjs";
import { addDays, subDays, startOfDay, format } from "date-fns";
import { sql, eq } from "drizzle-orm";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5433/Qazanaid";

const pool = new Pool({
    connectionString: databaseUrl,
});

const db = drizzle(pool, { schema });

async function seed() {
    console.log("🌱 Memulai proses seeding data...");

    // 1. Create Superuser
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(schema.users).values({
        username: "admin",
        password: hashedPassword,
        firstName: "Super",
        lastName: "User",
        email: "admin@stockify.com",
        isSuperAdmin: 1,
    } as any).onConflictDoNothing().returning();

    const userRes = await db.query.users.findFirst({
        where: (u: any, { eq }: any) => eq(u.username, "admin")
    });
    const userId = (adminUser as any)?.id || userRes?.id;

    if (!userId) {
        console.error("❌ Gagal membuat atau menemukan user admin.");
        process.exit(1);
    }

    console.log(`✅ User Admin siap: ${userId}`);

    // 2. Set Role
    await db.insert(schema.userRoles).values({
        userId,
        role: "admin",
    }).onConflictDoNothing();

    // 3. Create Branches
    const [branchPusat] = await db.insert(schema.branches).values({
        name: "Pusat (HQ)",
        address: "Jl. Industri No. 1",
        type: "factory",
        userId,
    }).returning();

    const [branchToko] = await db.insert(schema.branches).values({
        name: "Toko Utama",
        address: "Mall Central Lt. 1",
        type: "store",
        userId,
    }).returning();

    console.log("✅ Cabang dibuat.");

    // 4. Create Categories & Units
    const cats = ["Elektronik", "Sembako", "ATK", "Plastik"];
    const categoryIds = [];
    for (const cat of cats) {
        const [c] = await db.insert(schema.categories).values({ name: cat, userId }).onConflictDoNothing().returning();
        if (c) categoryIds.push(c.id);
    }

    const [unitPcs] = await db.insert(schema.units).values({ name: "Pcs", userId }).onConflictDoNothing().returning();
    const [unitKg] = await db.insert(schema.units).values({ name: "Kg", userId }).onConflictDoNothing().returning();

    // 5. Create Products
    const productsData = [
        { name: "Kopi Arabika 250g", price: 75000, cost: 45000, cat: "Sembako" },
        { name: "Gula Pasir 1kg", price: 16000, cost: 12000, cat: "Sembako" },
        { name: "Laptop Business Pro", price: 12000000, cost: 9500000, cat: "Elektronik" },
        { name: "Mouse Wireless", price: 150000, cost: 80000, cat: "Elektronik" },
        { name: "Kertas A4 80g", price: 55000, cost: 40000, cat: "ATK" },
        { name: "Botol Plastik 500ml", price: 2000, cost: 800, cat: "Plastik" },
    ];

    const createdProducts = [];
    for (const p of productsData) {
        const [prod] = await db.insert(schema.products).values({
            sku: `SKU-${p.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
            name: p.name,
            category: p.cat,
            sellingPrice: p.price.toString(),
            unitCost: p.cost.toString(),
            currentStock: 0,
            userId,
            locationType: "toko",
        }).returning();
        createdProducts.push(prod);
    }

    console.log(`✅ ${createdProducts.length} Produk dibuat.`);

    // 6. Loop 30 days history
    console.log("⏳ Menghasilkan histori 30 hari (Inbound & Sales)...");

    for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");

        // a. Inbound (twice a week)
        if (i % 4 === 0) {
            const [session] = await db.insert(schema.inboundSessions).values({
                title: `Restock Berkala - ${dateStr}`,
                status: "completed",
                startedAt: date,
                completedAt: date,
                userId,
                branchId: branchToko.id,
            }).returning();

            for (const prod of createdProducts) {
                const qty = Math.floor(Math.random() * 50) + 20;
                await db.insert(schema.inboundItems).values({
                    sessionId: session.id,
                    productId: prod.id,
                    quantityReceived: qty,
                });

                // Add to Inventory Lots
                await db.insert(schema.inventoryLots).values({
                    productId: prod.id,
                    branchId: branchToko.id,
                    purchasePrice: prod.unitCost!,
                    initialQuantity: qty,
                    remainingQuantity: qty,
                    inboundDate: date,
                    inboundSessionId: session.id,
                });

                // Update Global Stock
                await db.execute(sql`UPDATE products SET current_stock = current_stock + ${qty} WHERE id = ${prod.id}`);
            }
        }

        // b. Sales (5-10 per day)
        const salesCount = Math.floor(Math.random() * 6) + 5;
        for (let s = 0; s < salesCount; s++) {
            const saleId = `INV-${dateStr.replace(/-/g, "")}-${s}`;
            const [sale] = await db.insert(schema.sales).values({
                uuid: crypto.randomUUID(),
                invoiceNumber: saleId,
                totalAmount: "0", // update later
                paymentMethod: "cash",
                paymentStatus: "paid",
                userId,
                branchId: branchToko.id,
                type: "pos",
                createdAt: date,
            }).returning();

            let totalAmount = 0;
            let totalCogs = 0;

            // Pick 1-3 random products
            const itemChoices = createdProducts.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

            for (const prod of itemChoices) {
                const qty = Math.floor(Math.random() * 3) + 1;
                const subtotal = qty * Number(prod.sellingPrice);
                const cogs = qty * Number(prod.unitCost);

                await db.insert(schema.saleItems).values({
                    saleId: sale.id,
                    productId: prod.id,
                    quantity: qty.toString(),
                    unitPrice: prod.sellingPrice!,
                    subtotal: subtotal.toString(),
                    cogs: cogs.toString(),
                });

                totalAmount += subtotal;
                totalCogs += cogs;

                // Deduct stock (simple)
                await db.execute(sql`UPDATE products SET current_stock = current_stock - ${qty} WHERE id = ${prod.id}`);
                // Deduct from lots (simulated by just updating the oldest lot)
                const [oldestLot] = await db.select().from(schema.inventoryLots).where(eq(schema.inventoryLots.productId, prod.id)).orderBy(schema.inventoryLots.inboundDate).limit(1);
                if (oldestLot) {
                    await db.execute(sql`UPDATE inventory_lots SET remaining_quantity = GREATEST(0, remaining_quantity - ${qty}) WHERE id = ${oldestLot.id}`);
                }
            }

            await db.update(schema.sales).set({ totalAmount: totalAmount.toString() }).where(eq(schema.sales.id, sale.id));

            // c. Auto Journal for Sale
            const [entry] = await db.insert(schema.journalEntries).values({
                date,
                description: `Penjualan POS #${saleId}`,
                reference: saleId,
                userId,
                createdAt: date,
            }).returning();

            // Kas (Debit)
            await db.insert(schema.journalItems).values({
                entryId: entry.id,
                accountId: 1, // Placeholder
                debit: totalAmount.toString(),
                credit: "0",
                userId,
                branchId: branchToko.id,
            });
            // Penjualan (Credit)
            await db.insert(schema.journalItems).values({
                entryId: entry.id,
                accountId: 4, // Placeholder
                debit: "0",
                credit: totalAmount.toString(),
                userId,
                branchId: branchToko.id,
            });
        }
    }

    console.log("✨ Seeding selesai!");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding gagal:", err);
    process.exit(1);
});
