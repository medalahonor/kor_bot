import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  await p.$connect();
  const campaigns = await p.campaigns.findMany();
  console.log('OK, campaigns:', campaigns.length);
} catch (e) {
  console.error('FAIL:', e.message);
} finally {
  await p.$disconnect();
}
