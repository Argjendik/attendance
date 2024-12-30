import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN'
      },
    });

    console.log('Admin user created:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 