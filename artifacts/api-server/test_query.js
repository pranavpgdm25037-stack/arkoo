import { db, leadsTable, customersTable, projectsTable } from "@workspace/db";
import { eq, ilike, desc } from "drizzle-orm";

async function run() {
  const targetLeadId = 151;
  console.log("Testing Drizzle queries for targetLeadId = 151...");

  try {
    console.log("1. Updating leads table...");
    await db.update(leadsTable)
      .set({ 
        status: "Form Filled",
        aiScore: 40,
        aiCategory: "WARM",
        rawData: { test: true }
      })
      .where(eq(leadsTable.id, targetLeadId));
    console.log("leads table updated successfully.");

    console.log("2. Querying customers table...");
    const [cust] = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.leadId, targetLeadId)).limit(1);
    console.log("customers query succeeded, cust:", cust);

    const customerIdToUpdate = cust?.id;
    if (customerIdToUpdate) {
      console.log("3. Updating projects table...");
      await db.update(projectsTable)
        .set({
          type: "PEB Warehouse",
          areaSqft: 5000,
          budget: "1000000",
          timeline: "1 - 3 months"
        })
        .where(eq(projectsTable.customerId, customerIdToUpdate));
      console.log("projects table updated successfully.");
    } else {
      console.log("No customer record to update.");
    }
  } catch (err) {
    console.error("Drizzle Query Error Stack:");
    console.error(err.stack || err);
  }
}

run();
