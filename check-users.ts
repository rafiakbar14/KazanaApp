import { db } from "./server/db";
import { users } from "./shared/models/auth";
import { eq } from "drizzle-orm";

async function verifyUser() {
  // Automatically verify rafbarpratama with integer 1
  await db.update(users)
    .set({ isVerified: 1 })
    .where(eq(users.username, "rafbarpratama"));
  
  console.log("Verified user rafbarpratama successfully (status: 1).");
  process.exit(0);
}

verifyUser().catch(err => {
  console.error(err);
  process.exit(1);
});
