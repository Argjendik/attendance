"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
async function createAdmin() {
    const prisma = new client_1.PrismaClient();
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
    }
    catch (error) {
        console.error('Error creating admin:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdmin();
//# sourceMappingURL=create-admin.js.map