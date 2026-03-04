import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && process.env.NODE_ENV !== 'production' && databaseUrl.includes('@db:')) {
    databaseUrl = databaseUrl.replace('@db:', '@localhost:');
}

const pool = new pg.Pool({
    connectionString: databaseUrl,
});

async function checkSchema() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'opname_records' 
      AND column_name IN ('returned_quantity', 'returned_notes');
    `);

        const foundColumns = res.rows.map(r => r.column_name);
        console.log("Found columns:", foundColumns);

        if (!foundColumns.includes('returned_quantity') || !foundColumns.includes('returned_notes')) {
            console.log("MISSING_COLUMNS");
        } else {
            console.log("SCHEMA_OK");
        }

        await pool.end();
    } catch (err) {
        console.error("DEBUG_ERROR:", err.message);
    }
}

checkSchema();
