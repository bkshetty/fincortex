const { Client } = require('pg');

// Using the DIRECT_URL for the test
const connectionString = "postgresql://postgres.kbwlyyhgotoymqfoeirb:FinCortex_%23Secure_v3_2026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting direct connection to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const res = await client.query('SELECT COUNT(*) FROM "Invoice"');
    console.log(`\n✅ DATABASE IS WORKING!`);
    console.log(`Total Invoices Stored: ${res.rows[0].count}`);
    
    if (res.rows[0].count > 0) {
      const latest = await client.query('SELECT vendor_name, invoice_number, fraud_signals FROM "Invoice" ORDER BY created_at DESC LIMIT 1');
      const inv = latest.rows[0];
      console.log('\nLatest Invoice Details:');
      console.log(`- Vendor: ${inv.vendor_name}`);
      console.log(`- Invoice #: ${inv.invoice_number}`);
      console.log(`- Fraud Signals:`, JSON.stringify(inv.fraud_signals, null, 2));
    }

  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.error('Stack trace:', err.stack);
  } finally {
    await client.end();
  }
}

testConnection();
