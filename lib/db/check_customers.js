import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.lbvltsahxiavgvnzgqon:arkooprebuildai123@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT *
      FROM customers
      ORDER BY id DESC
      LIMIT 10
    `);
    console.log("\n==================================================");
    console.log("🔍 RECENT DATABASE CUSTOMERS (LATEST 10):");
    console.log("==================================================");
    console.log(JSON.stringify(res.rows, null, 2));
    console.log("==================================================\n");
  } catch (err) {
    console.error("Error querying DB:", err.message);
  } finally {
    await client.end();
  }
}
run();
