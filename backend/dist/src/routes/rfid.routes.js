"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const handleRFIDScan = async (req, res) => {
    try {
        const { rfidCode } = req.body;
        const agent = await prisma.agent.findFirst({
            where: {
                rfidCode,
                status: 'ACTIVE',
            },
            include: {
                office: true,
            },
        });
        if (!agent) {
            res.status(404).json({ error: 'Agent not found or inactive' });
            return;
        }
        const lastRecord = await prisma.attendanceRecord.findFirst({
            where: {
                agentId: agent.id,
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        const action = !lastRecord || lastRecord.action === 'CHECK_OUT' ? 'CHECK_IN' : 'CHECK_OUT';
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
        const expectedIn = agent.office.expectedCheckIn;
        const expectedOut = agent.office.expectedCheckOut;
        let status = 'ON_TIME';
        if (action === 'CHECK_IN' && currentTime > expectedIn) {
            status = 'LATE';
        }
        else if (action === 'CHECK_OUT' && currentTime < expectedOut) {
            status = 'EARLY';
        }
        let workingHours = null;
        if (action === 'CHECK_OUT' && lastRecord) {
            const checkInTime = new Date(lastRecord.timestamp);
            workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }
        const record = await prisma.attendanceRecord.create({
            data: {
                agentId: agent.id,
                action,
                source: 'RFID',
                status,
                timestamp: now,
                expectedIn: agent.office.expectedCheckIn,
                expectedOut: agent.office.expectedCheckOut,
                workingHours,
                lastCheckIn: action === 'CHECK_OUT' ? lastRecord?.timestamp : null,
            },
            include: {
                agent: {
                    include: {
                        office: true,
                    },
                },
            },
        });
        res.json(record);
    }
    catch (error) {
        console.error('Error processing RFID scan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
router.post('/scan', handleRFIDScan);
exports.default = router;
//# sourceMappingURL=rfid.routes.js.map