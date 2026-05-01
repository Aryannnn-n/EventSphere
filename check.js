const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const hods = await prisma.user.findMany({ where: { role: 'HOD' } });
  console.log('HODs:', hods.map(h => ({ email: h.email, department: h.department })));

  const events = await prisma.event.findMany({ select: { id: true, title: true, department: true, status: true } });
  console.log('Events:', events);
}

check().catch(console.error).finally(() => prisma.$disconnect());
