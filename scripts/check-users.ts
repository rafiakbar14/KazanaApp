import { db } from "../server/db";
import { users, userRoles, products } from "../shared/schema";

async function checkData() {
    try {
        const allUsers = await db.select().from(users);
        console.log("USERS:", allUsers.map(u => ({ id: u.id, username: u.username, posPin: u.posPin })));

        const allRoles = await db.select().from(userRoles);
        console.log("ROLES:", allRoles);

        const allProducts = await db.select().from(products);
        console.log("PRODUCTS COUNT:", allProducts.length);
    } catch (e) {
        console.error("ERROR CHECKING DATA:", e);
    }
}

checkData();
