import { db, customersTable } from "@workspace/db";

async function run() {
  try {
    const customers = await db.select().from(customersTable);
    console.log("All Customers in DB:", JSON.stringify(customers, null, 2));
  } catch (err) {
    console.error("Error querying DB:", err.message);
  }
}

run();
