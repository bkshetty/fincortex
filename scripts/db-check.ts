import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.invoice.count()
    console.log(`Total Invoices in Database: ${count}`)
    
    if (count > 0) {
      const latest = await prisma.invoice.findFirst({
        orderBy: { created_at: 'desc' },
        select: { vendor_name: true, invoice_number: true, created_at: true }
      })
      console.log('Most recent invoice:', latest)
    }
  } catch (error) {
    console.error('Database Connection Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
