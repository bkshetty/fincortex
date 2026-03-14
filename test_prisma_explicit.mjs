import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
try {
  if (prisma.userPreference) {
    console.log('SUCCESS: userPreference model found');
  } else {
    console.log('FAILURE: userPreference model is NOT found on prisma client');
  }
} catch (e) {
  console.log('ERROR: ', e.message);
} finally {
  await prisma.$disconnect()
}
process.exit(0)
