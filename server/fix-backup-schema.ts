import pg from "pg";

const LOCAL_DB = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/Qazanaid";

async function fixBackupSchema() {
    console.log("🛠️ Memulai perbaikan manual struktur tabel opname_sessions...");
    const pool = new pg.Pool({ connectionString: LOCAL_DB });

    try {
        const client = await pool.connect();
        
        console.log("🔍 Mengecek kolom yang ada di opname_sessions...");
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'opname_sessions'
        `);
        const existingCols = res.rows.map(r => r.column_name);

        const addCol = async (col: string, type: string) => {
            if (!existingCols.includes(col)) {
                console.log(`➕ Menambahkan kolom: ${col}...`);
                await client.query(`ALTER TABLE opname_sessions ADD COLUMN ${col} ${type}`);
                console.log(`✅ Kolom ${col} berhasil ditambahkan.`);
            } else {
                console.log(`ℹ️ Kolom ${col} sudah ada.`);
            }
        };

        // Add backup related columns
        await addCol("backup_status", "TEXT DEFAULT 'none' NOT NULL");
        await addCol("backup_logs", "TEXT");
        await addCol("g_drive_url", "TEXT");

        console.log("\n✨ PERBAIKAN STRUKTUR SELESAI!");
        client.release();
    } catch (err: any) {
        console.error("❌ Gagal memperbaiki struktur:", err.message);
    } finally {
        await pool.end();
    }
}

fixBackupSchema();
