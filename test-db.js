const { Client } = require('pg');

const client = new Client({
  user: 'postgres.kbwlyyhgotoymqfoeirb',
  host: 'aws-0-ap-southeast-2.pooler.supabase.com',
  database: 'postgres',
  password: 'FinCortex_#Secure_v3_2026',
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected!");
    const res = await client.query('SELECT NOW()');
    console.log("Query success:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection error:", err.message);
  }
}

test();
