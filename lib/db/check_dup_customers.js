import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.lbvltsahxiavgvnzgqon:arkooprebuildai123@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
});

async function run() {
  try {
    await client.connect();
    
    console.log("Checking customers with lead_id = 151:");
    const res1 = await client.query("SELECT * FROM customers WHERE lead_id = 151");
    console.log(res1.rows);

    console.log("Checking customers with lead_id = 152:");
    const res2 = await client.query("SELECT * FROM customers WHERE lead_id = 152");
    console.log(res2.rows);
  } catch (err) {
    console.error("Error querying DB:", err.message);
  } finally {
    await client.end();
  }
}
run();
