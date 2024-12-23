import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, UnauthorizedException, BadRequestException, NotFoundException, Request, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(private prisma: PrismaService) {}

  @Post('check')
  @Roles('ADMIN', 'HR', 'MANAGER')
  async checkAttendance(@Body() data: any, @Request() req) {
    try {
      this.logger.log('Received attendance check request:', data);

      let agent;

      // Find agent by ID or RFID code
      if (data.agentId) {
        agent = await this.prisma.agent.findUnique({
          where: { id: parseInt(data.agentId) },
          include: {
            office: true,
          },
        });
      } else if (data.rfidCode) {
        agent = await this.prisma.agent.findUnique({
          where: { rfidCode: data.rfidCode },
          include: {
            office: true,
          },
        });
      }

      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Get the user who is recording the attendance
      const recordingUser = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          offices: true,
        },
      });

      // Check if HR has access to this office
      if (recordingUser.role === 'HR') {
        const hasAccess = recordingUser.offices.some(office => office.id === agent.officeId);
        if (!hasAccess) {
          throw new UnauthorizedException('You can only record attendance for agents in your assigned offices');
        }
      }

      const now = data.timestamp ? new Date(data.timestamp) : new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Get existing records for today
      const existingRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          agentId: agent.id,
          timestamp: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Validate check-in/check-out sequence
      if (data.action === 'CHECK_IN' && existingRecords.length > 0 && existingRecords[0].action === 'CHECK_IN') {
        throw new BadRequestException('Agent is already checked in');
      }
      if (data.action === 'CHECK_OUT' && (existingRecords.length === 0 || existingRecords[0].action === 'CHECK_OUT')) {
        throw new BadRequestException('Agent must check in first');
      }

      // Create the new attendance record
      const record = await this.prisma.attendanceRecord.create({
        data: {
          agentId: agent.id,
          action: data.action,
          source: data.isManualEntry === true ? 'MANUAL' : (data.rfidCode ? 'RFID' : 'MANUAL'),
          recordedBy: data.recordedBy || recordingUser.email,
          expectedIn: agent.office.expectedCheckIn,
          expectedOut: agent.office.expectedCheckOut,
          status: this.calculateStatus(now, data.action, agent.office),
          timestamp: now,
          workingHours: data.action === 'CHECK_OUT' ? this.calculateWorkingHours(existingRecords[0]?.timestamp, now) : null,
          lastCheckIn: data.action === 'CHECK_OUT' ? existingRecords[0]?.timestamp : null,
        },
        include: {
          agent: {
            include: {
              office: true,
            },
          },
        },
      });

      this.logger.log('Created attendance record:', record);

      return {
        success: true,
        data: record,
        message: `${data.action === 'CHECK_IN' ? 'Check-in' : 'Check-out'} successful`,
      };
    } catch (error) {
      this.logger.error('Error creating attendance record:', error);
      if (error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create attendance record. Please check your input.');
    }
  }

  private calculateStatus(timestamp: Date, action: string, office: any): string {
    const time = timestamp.getHours() * 60 + timestamp.getMinutes();
    
    if (action === 'CHECK_IN') {
      const [expectedHour, expectedMinute] = office.expectedCheckIn.split(':').map(Number);
      const expectedTime = expectedHour * 60 + expectedMinute;
      return time <= expectedTime ? 'ON_TIME' : 'LATE';
    } else {
      const [expectedHour, expectedMinute] = office.expectedCheckOut.split(':').map(Number);
      const expectedTime = expectedHour * 60 + expectedMinute;
      return time >= expectedTime ? 'ON_TIME' : 'EARLY';
    }
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'HR')
  async getAttendanceRecords(
    @Query() query: {
      startDate?: string;
      endDate?: string;
      officeId?: string;
      status?: string;
      agentId?: string;
    },
    @Request() req
  ) {
    try {
      this.logger.log('Getting attendance records with query:', query);
      this.logger.log('User:', req.user);

      const where: any = {};
      
      // Handle date filtering
      if (query.startDate || query.endDate) {
        const startDate = query.startDate 
          ? new Date(query.startDate)
          : new Date(new Date().setHours(0, 0, 0, 0));
        
        const endDate = query.endDate
          ? new Date(query.endDate)
          : new Date(new Date().setHours(23, 59, 59, 999));

        this.logger.log('Date range:', { startDate, endDate });

        where.timestamp = {
          gte: startDate,
          lte: endDate,
        };
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.officeId) {
        where.agent = {
          ...where.agent,
          officeId: parseInt(query.officeId),
        };
      }

      if (query.agentId) {
        where.agentId = parseInt(query.agentId);
      }

      // If user is HR, only show records from their assigned offices
      if (req.user.role === 'HR') {
        const user = await this.prisma.user.findUnique({
          where: { id: req.user.id },
          include: { offices: true },
        });
        
        if (!user || !user.offices || user.offices.length === 0) {
          return {
            success: true,
            data: {
              records: [],
              stats: {
                totalRecords: 0,
                lateCheckIns: 0,
                earlyDepartures: 0,
                onTime: 0,
              },
            },
          };
        }

        const officeIds = user.offices.map(office => office.id);
        where.agent = {
          ...where.agent,
          officeId: { in: officeIds },
        };
      }

      // Get all records
      const records = await this.prisma.attendanceRecord.findMany({
        where,
        include: {
          agent: {
            include: {
              office: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Calculate stats
      const stats = {
        totalRecords: records.length,
        lateCheckIns: records.filter(r => r.status === 'LATE').length,
        earlyDepartures: records.filter(r => r.status === 'EARLY').length,
        onTime: records.filter(r => r.status === 'ON_TIME').length,
      };

      return {
        success: true,
        data: {
          records,
          stats,
        },
      };
    } catch (error) {
      this.logger.error('Error getting attendance records:', error);
      throw new BadRequestException('Failed to get attendance records');
    }
  }

  @Put(':id')
  @Roles('ADMIN', 'HR', 'MANAGER')
  async updateAttendanceRecord(
    @Param('id') id: string,
    @Body() data: {
      timestamp?: string;
      status?: string;
    },
    @Request() req
  ) {
    try {
      // First get the record to check permissions
      const existingRecord = await this.prisma.attendanceRecord.findUnique({
        where: { id: parseInt(id) },
        include: {
          agent: {
            include: {
              office: true,
            },
          },
        },
      });

      if (!existingRecord) {
        throw new NotFoundException('Attendance record not found');
      }

      // If HR, check if they have access to this office
      if (req.user.role === 'HR') {
        const user = await this.prisma.user.findUnique({
          where: { id: req.user.id },
          include: { offices: true },
        });

        const hasAccess = user.offices.some(office => office.id === existingRecord.agent.officeId);
        if (!hasAccess) {
          throw new UnauthorizedException('You can only edit attendance records for agents in your assigned offices');
        }
      }

      // Update the record
      const timestamp = data.timestamp ? new Date(data.timestamp) : existingRecord.timestamp;
      const status = data.status || existingRecord.status;

      // Calculate working hours if this is a check-out record
      let workingHours = existingRecord.workingHours;
      if (existingRecord.action === 'CHECK_OUT' && existingRecord.lastCheckIn) {
        workingHours = this.calculateWorkingHours(existingRecord.lastCheckIn, timestamp);
      }

      const record = await this.prisma.attendanceRecord.update({
        where: { id: parseInt(id) },
        data: {
          timestamp,
          status,
          workingHours,
        },
        include: {
          agent: {
            include: {
              office: true,
            },
          },
        },
      });

      return {
        success: true,
        data: record,
        message: 'Attendance record updated successfully',
      };
    } catch (error) {
      console.error('Error updating attendance record:', error);
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to update attendance record');
    }
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR', 'MANAGER')
  async deleteAttendanceRecord(@Param('id') id: string, @Request() req) {
    try {
      // First get the record to check permissions
      const existingRecord = await this.prisma.attendanceRecord.findUnique({
        where: { id: parseInt(id) },
        include: {
          agent: {
            include: {
              office: true,
            },
          },
        },
      });

      if (!existingRecord) {
        throw new NotFoundException('Attendance record not found');
      }

      // If HR, check if they have access to this office
      if (req.user.role === 'HR') {
        const user = await this.prisma.user.findUnique({
          where: { id: req.user.id },
          include: { offices: true },
        });

        const hasAccess = user.offices.some(office => office.id === existingRecord.agent.officeId);
        if (!hasAccess) {
          throw new UnauthorizedException('You can only delete attendance records for agents in your assigned offices');
        }
      }

      await this.prisma.attendanceRecord.delete({
        where: { id: parseInt(id) },
      });

      return {
        success: true,
        message: 'Record deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete attendance record');
    }
  }

  @Get('latest-status')
  @Roles('ADMIN', 'HR', 'MANAGER')
  async getLatestStatus(@Request() req) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Get all agents based on user role
      let agents;
      if (req.user.role === 'HR') {
        const user = await this.prisma.user.findUnique({
          where: { id: req.user.id },
          include: { offices: true },
        });

        if (!user?.offices?.length) {
          return {
            success: true,
            data: {
              statuses: {}
            }
          };
        }

        agents = await this.prisma.agent.findMany({
          where: {
            officeId: {
              in: user.offices.map(office => office.id)
            }
          }
        });
      } else {
        agents = await this.prisma.agent.findMany();
      }

      // Get latest attendance records for today for all agents
      const latestRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          agentId: {
            in: agents.map(agent => agent.id)
          },
          timestamp: {
            gte: startOfDay,
            lte: endOfDay,
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        distinct: ['agentId']
      });

      // Create a map of agent ID to their current status
      const statuses = {};
      agents.forEach(agent => {
        const latestRecord = latestRecords.find(record => record.agentId === agent.id);
        statuses[agent.id] = latestRecord?.action === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT';
      });

      return {
        success: true,
        data: {
          statuses
        }
      };
    } catch (error) {
      this.logger.error('Error fetching latest attendance status:', error);
      throw new BadRequestException('Failed to fetch attendance status');
    }
  }

  private calculateWorkingHours(checkInTime: Date, checkOutTime: Date): number | null {
    if (!checkInTime || !checkOutTime) {
      return null;
    }
    
    const diffInMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    return Math.round(diffInHours * 100) / 100; // Round to 2 decimal places
  }
} 