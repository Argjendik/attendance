import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

const router = Router();
const prisma = new PrismaClient();

type AttendanceStatusType = 'ON_TIME' | 'LATE' | 'EARLY';
type AttendanceActionType = 'CHECK_IN' | 'CHECK_OUT';
type AttendanceSourceType = 'RFID' | 'MANUAL';

interface RFIDRequestBody {
  rfidCode: string;
}

const handleRFIDScan: RequestHandler<{}, any, RFIDRequestBody> = async (req, res) => {
  try {
    const { rfidCode } = req.body;

    // Find the agent by RFID code
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

    // Get the last attendance record for this agent
    const lastRecord = await prisma.attendanceRecord.findFirst({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Determine the action based on the last record
    const action: AttendanceActionType = !lastRecord || lastRecord.action === 'CHECK_OUT' ? 'CHECK_IN' : 'CHECK_OUT';

    // Get current time
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

    // Get expected times from agent's office
    const expectedIn = agent.office.expectedCheckIn;
    const expectedOut = agent.office.expectedCheckOut;

    // Determine status
    let status: AttendanceStatusType = 'ON_TIME';
    if (action === 'CHECK_IN' && currentTime > expectedIn) {
      status = 'LATE';
    } else if (action === 'CHECK_OUT' && currentTime < expectedOut) {
      status = 'EARLY';
    }

    // Calculate working hours if checking out
    let workingHours = null;
    if (action === 'CHECK_OUT' && lastRecord) {
      const checkInTime = new Date(lastRecord.timestamp);
      workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60); // Convert to hours
    }

    // Create the attendance record
    const record = await prisma.attendanceRecord.create({
      data: {
        agentId: agent.id,
        action,
        source: 'RFID' as AttendanceSourceType,
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
  } catch (error) {
    console.error('Error processing RFID scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/scan', handleRFIDScan);

export default router; 