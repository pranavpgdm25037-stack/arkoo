import pg from 'pg';
import dns from 'dns/promises';

const { Client } = pg;

const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "sa-east-1",
  "ca-central-1"
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  
  // 1. Resolve host
  try {
    const ips = await dns.resolve4(host);
    if (!ips || ips.length === 0) return { region, status: "dns_failed" };
  } catch (e) {
    return { region, status: "dns_failed", error: e.message };
  }

  // 2. Try connect
  const connStr = `postgresql://postgres.lbvltsahxiavgvnzgqon:arkooprebuildai123@${host}:6543/postgres`;
  const client = new Client({
    connectionString: connStr,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    await client.end();
    return { region, status: "success" };
  } catch (err) {
    return { region, status: "error", code: err.code, message: err.message };
  }
}

async function run() {
  console.log("Starting regional pooler scan for lbvltsahxiavgvnzgqon...");
  for (const region of regions) {
    const res = await testRegion(region);
    console.log(`Region ${region.padEnd(15)}: ${res.status.toUpperCase()} - ${res.message || res.error || ""}`);
    if (res.status === "success") {
      console.log(`\n🎉 FOUND IT! The correct pooler region is: ${region}`);
      break;
    }
  }
}

run();
