import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@met.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@met.edu',
      password: hashedPassword,
      role: 'ADMIN',
      isFirstLogin: false,
    },
  });
  console.log('✅ Admin seeded: admin@met.edu / Admin@123');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
