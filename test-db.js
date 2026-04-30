const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({
    where: { email: 'admin@met.edu' }
  });
  console.log(user);
  
  if (user) {
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare('Admin@123', user.password);
    console.log('Password match:', match);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
