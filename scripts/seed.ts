// Run with `npm run db:seed`. Kept independent of lib/auth.ts (which pulls
// in next/headers) so it works as a plain Node script via tsx.
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../db/schema";

const DEMO_EMAIL = "demo@leasekeeper.test";
const DEMO_PASSWORD = "password123";

async function main() {
  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing) {
    console.log(`Demo manager already exists: ${DEMO_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.insert(users).values({
    name: "Demo Manager",
    email: DEMO_EMAIL,
    passwordHash,
    role: "manager",
  });

  console.log("Created demo manager account:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
