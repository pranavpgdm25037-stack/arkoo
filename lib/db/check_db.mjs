import pg from 'pg';

const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.lbvltsahxiavgvnzgqon:arkooprebuildai123@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to Supabase Postgres!");

    // Check leads
    const res = await client.query('SELECT id, source, status, ai_score, ai_category, created_at FROM public.leads ORDER BY id DESC LIMIT 5');
    console.log("Latest leads in public.leads:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
