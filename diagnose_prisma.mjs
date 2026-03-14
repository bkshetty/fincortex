import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
try {
  console.log('Prisma keys:', Object.keys(prisma))
  console.log('UserPreference exists:', typeof prisma.userPreference !== 'undefined')
  if (prisma.userPreference) {
    console.log('UserPreference properties:', Object.keys(prisma.userPreference))
  }
} catch (e) {
  console.error('Error checking Prisma:', e)
} finally {
  await prisma.$disconnect()
}
process.exit(0)
