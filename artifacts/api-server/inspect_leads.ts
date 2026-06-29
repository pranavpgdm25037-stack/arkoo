import { db, leadsTable, projectsTable } from "@workspace/db";

async function run() {
  const leads = await db.select().from(leadsTable).limit(5);
  console.log(JSON.stringify(leads, null, 2));
  process.exit(0);
}
run();
