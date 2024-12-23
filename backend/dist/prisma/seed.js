"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.attendanceRecord.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.user.deleteMany();
    await prisma.office.deleteMany();
    const kosti = await prisma.office.create({
        data: {
            name: 'Kosti',
            location: 'Kosti',
            checkInMethods: ['MANUAL', 'RFID'],
            expectedCheckIn: '09:00',
            expectedCheckOut: '17:00',
        },
    });
    const zyra = await prisma.office.create({
        data: {
            name: 'Zyra',
            location: 'Kosti',
            checkInMethods: ['MANUAL', 'RFID'],
            expectedCheckIn: '09:00',
            expectedCheckOut: '17:00',
        },
    });
    const adminPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
        data: {
            email: 'admin@kosti.com',
            password: adminPassword,
            name: 'Admin',
            role: 'ADMIN',
            offices: {
                connect: [
                    { id: kosti.id },
                    { id: zyra.id }
                ]
            }
        },
    });
    const hrPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
        data: {
            email: 'hr@kosti.com',
            password: hrPassword,
            name: 'HR Kosti',
            role: 'HR',
            offices: {
                connect: [{ id: kosti.id }]
            }
        },
    });
    await prisma.user.create({
        data: {
            email: 'hr@zyra.com',
            password: hrPassword,
            name: 'HR Zyra',
            role: 'HR',
            offices: {
                connect: [{ id: zyra.id }]
            }
        },
    });
    const agent1 = await prisma.agent.create({
        data: {
            name: 'Argjend',
            email: 'argjend@kosti.com',
            rfidCode: 'RFID001',
            status: 'ACTIVE',
            officeId: kosti.id,
        },
    });
    const agent2 = await prisma.agent.create({
        data: {
            name: 'Argjend 2',
            email: 'argjend2@kosti.com',
            rfidCode: 'RFID002',
            status: 'ACTIVE',
            officeId: kosti.id,
        },
    });
    const agent3 = await prisma.agent.create({
        data: {
            name: 'Argjend 3',
            email: 'argjend3@zyra.com',
            rfidCode: 'RFID003',
            status: 'ACTIVE',
            officeId: zyra.id,
        },
    });
    const agent4 = await prisma.agent.create({
        data: {
            name: 'Argjend 4',
            email: 'argjend4@zyra.com',
            rfidCode: 'RFID004',
            status: 'ACTIVE',
            officeId: zyra.id,
        },
    });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    await prisma.attendanceRecord.create({
        data: {
            agentId: agent1.id,
            action: 'CHECK_IN',
            source: 'RFID',
            expectedIn: kosti.expectedCheckIn,
            expectedOut: kosti.expectedCheckOut,
            status: 'ON_TIME',
            timestamp: new Date(today.setHours(9, 0, 0)),
            recordedBy: 'hr@kosti.com',
        },
    });
    await prisma.attendanceRecord.create({
        data: {
            agentId: agent2.id,
            action: 'CHECK_IN',
            source: 'MANUAL',
            expectedIn: kosti.expectedCheckIn,
            expectedOut: kosti.expectedCheckOut,
            status: 'LATE',
            timestamp: new Date(today.setHours(9, 30, 0)),
            recordedBy: 'hr@kosti.com',
        },
    });
    await prisma.attendanceRecord.create({
        data: {
            agentId: agent3.id,
            action: 'CHECK_IN',
            source: 'RFID',
            expectedIn: zyra.expectedCheckIn,
            expectedOut: zyra.expectedCheckOut,
            status: 'ON_TIME',
            timestamp: new Date(today.setHours(9, 0, 0)),
            recordedBy: 'hr@zyra.com',
        },
    });
    await prisma.attendanceRecord.create({
        data: {
            agentId: agent4.id,
            action: 'CHECK_IN',
            source: 'MANUAL',
            expectedIn: zyra.expectedCheckIn,
            expectedOut: zyra.expectedCheckOut,
            status: 'LATE',
            timestamp: new Date(today.setHours(9, 30, 0)),
            recordedBy: 'hr@zyra.com',
        },
    });
    console.log('Database has been seeded. 🌱');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map