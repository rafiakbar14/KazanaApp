import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('@db:')) {
    connectionString = connectionString.replace('@db:', '@localhost:');
}

const pool = new pg.Pool({
    connectionString: connectionString,
});

async function diagnose() {
    try {
        console.log("Connecting to:", connectionString.replace(/:([^:@]+)@/, ":****@"));
        const client = await pool.connect();
        console.log("Connected successfully!");

        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log("Tables found:", tables.rows.map(r => r.table_name).join(", "));

        const userCount = await client.query('SELECT count(*) FROM users;');
        console.log("User count:", userCount.rows[0].count);

        const sessionCount = await client.query('SELECT count(*) FROM sessions;');
        console.log("Session count:", sessionCount.rows[0].count);

        const users = await client.query('SELECT id, username, first_name, last_name FROM users LIMIT 5;');
        console.log("Users sample:", users.rows);

        client.release();
        await pool.end();
    } catch (err) {
        console.error("DIAGNOSIS_ERROR:", err.message);
        process.exit(1);
    }
}

diagnose();
