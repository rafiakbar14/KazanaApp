import { db } from "./server/db.js";
import * as schema from "./shared/schema.js";

async function main() {
    const users = await db.select().from(schema.users);
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}
main();
