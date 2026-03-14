const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing connection to database...');
    const count = await prisma.invoice.count()
    console.log(`\n✅ DATABASE IS WORKING!`);
    console.log(`Total Invoices Stored: ${count}`);
    
    if (count > 0) {
      const latest = await prisma.invoice.findFirst({
        orderBy: { created_at: 'desc' },
        select: { vendor_name: true, invoice_number: true, created_at: true }
      })
      console.log('Most recent invoice data:');
      console.log(`- Vendor: ${latest.vendor_name}`);
      console.log(`- Invoice #: ${latest.invoice_number}`);
      console.log(`- Stored At: ${latest.created_at}`);
    } else {
      console.log('The database is empty. Ready for new uploads!');
    }
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION FAILED');
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect()
  }
}

main()
