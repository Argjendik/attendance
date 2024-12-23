import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as dayjs from 'dayjs';

type AttendanceSourceType = 'RFIDR' | 'RFIDO' | 'MANUAL';

@Controller('api/rfid')
export class RfidController {
  private readonly logger = new Logger(RfidController.name);

  constructor(private prisma: PrismaService) {}

  @Get('check/:cardNumber')
  async checkCard(@Param('cardNumber') cardNumber: string) {
    try {
      // Validate input
      if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.length < 4) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid card number format'
        }, HttpStatus.BAD_REQUEST);
      }

      // Find agent with this card number
      const agent = await this.prisma.agent.findFirst({
        where: {
          OR: [
            {
              rfidCode: {
                equals: cardNumber,
                mode: 'insensitive'
              }
            },
            {
              rfidCode: {
                equals: cardNumber.replace(/^0+/, ''),  // Try without leading zeros
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {
          office: true
        }
      });

      if (!agent) {
        this.logger.warn(`No agent found with RFID card: ${cardNumber}`);
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No agent found with this RFID card'
        }, HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        message: 'Card is registered',
        agent: {
          id: agent.id,
          name: agent.name,
          office: agent.office.name
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check card registration'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('scan')
  async handleRfidScan(@Body() body: { cardNumber: string, timestamp?: string, source?: AttendanceSourceType }) {
    try {
      const { cardNumber, timestamp, source } = body;
      
      // Validate input
      if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.length < 4) {
        this.logger.warn(`Invalid card number format received: ${cardNumber}`);
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid card number format'
        }, HttpStatus.BAD_REQUEST);
      }
      
      // Default to RFIDR if no source is provided
      const recordSource = source || 'RFIDR';
      this.logger.debug(`Received RFID scan request with card number: ${cardNumber}, source: ${recordSource}`);

      // Find agent with this card number
      let agent;
      try {
        agent = await this.prisma.agent.findFirst({
          where: {
            OR: [
              {
                rfidCode: {
                  equals: cardNumber,
                  mode: 'insensitive'
                }
              },
              {
                rfidCode: {
                  equals: cardNumber.replace(/^0+/, ''),  // Try without leading zeros
                  mode: 'insensitive'
                }
              }
            ]
          },
          include: {
            office: true
          }
        });

        if (!agent) {
          this.logger.warn(`No agent found with RFID card: ${cardNumber}`);
          throw new HttpException({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'No agent found with this RFID card'
          }, HttpStatus.NOT_FOUND);
        }

      } catch (dbError) {
        this.logger.error('Database error while finding agent:', dbError);
        throw new HttpException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error while finding agent'
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Parse the timestamp or use current time
      const scanTime = timestamp ? new Date(timestamp) : new Date();
      const scanDay = dayjs(scanTime);

      // Get the last attendance record for this agent on the same day
      let lastRecord;
      try {
        lastRecord = await this.prisma.attendanceRecord.findFirst({
          where: {
            agentId: agent.id,
            timestamp: {
              gte: scanDay.startOf('day').toDate(),
              lte: scanDay.endOf('day').toDate(),
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        this.logger.debug(`Last attendance record: ${JSON.stringify(lastRecord, null, 2)}`);

      } catch (dbError) {
        this.logger.error('Database error while finding last record:', dbError);
        throw new HttpException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error while finding last attendance record'
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const action = !lastRecord || lastRecord.action === 'CHECK_OUT' ? 'CHECK_IN' : 'CHECK_OUT';
      
      this.logger.debug(`Determined action: ${action}`);
      
      // Get expected times from agent's office
      const expectedIn = agent.office.expectedCheckIn;
      const expectedOut = agent.office.expectedCheckOut;
      
      // Determine status based on office schedule
      let status = 'ON_TIME';
      const scanDayjs = dayjs(scanTime);
      
      try {
        if (action === 'CHECK_IN') {
          const [hour, minute] = expectedIn.split(':').map(Number);
          const startTime = scanDayjs.hour(hour).minute(minute).second(0);
          this.logger.debug(`Check-in comparison - Scan time: ${scanDayjs.format('HH:mm:ss')}, Expected: ${startTime.format('HH:mm:ss')}`);
          
          // Add a 5-minute grace period for check-in
          const lateThreshold = startTime.add(5, 'minute');
          if (scanDayjs.isAfter(lateThreshold)) {
            status = 'LATE';
          }
        } else if (action === 'CHECK_OUT') {
          const [hour, minute] = expectedOut.split(':').map(Number);
          const endTime = scanDayjs.hour(hour).minute(minute).second(0);
          this.logger.debug(`Check-out comparison - Scan time: ${scanDayjs.format('HH:mm:ss')}, Expected: ${endTime.format('HH:mm:ss')}`);
          
          // Add a 5-minute grace period for check-out
          const earlyThreshold = endTime.subtract(5, 'minute');
          if (scanDayjs.isBefore(earlyThreshold)) {
            status = 'EARLY';
          }
        }

        this.logger.debug(`Determined status: ${status}`);

      } catch (timeError) {
        this.logger.error('Error calculating attendance status:', timeError);
        status = 'ON_TIME'; // Fallback to ON_TIME if there's an error in time calculation
      }

      // Calculate working hours if checking out
      let workingHours = null;
      if (action === 'CHECK_OUT' && lastRecord) {
        const checkInTime = new Date(lastRecord.timestamp);
        workingHours = (scanTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60); // Convert to hours
      }

      // Create new attendance record
      let attendance;
      try {
        attendance = await this.prisma.attendanceRecord.create({
          data: {
            agentId: agent.id,
            action,
            status,
            source: recordSource,
            timestamp: scanTime,
            expectedIn: agent.office.expectedCheckIn,
            expectedOut: agent.office.expectedCheckOut,
            workingHours,
            lastCheckIn: action === 'CHECK_OUT' ? lastRecord?.timestamp : null,
          },
          include: {
            agent: {
              include: {
                office: true
              }
            }
          }
        });

        this.logger.debug(`Created attendance record: ${JSON.stringify(attendance, null, 2)}`);

      } catch (dbError) {
        this.logger.error('Database error while creating attendance record:', dbError);
        throw new HttpException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error while creating attendance record'
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.logger.log(`${agent.name}: ${action} (${status})`);
      
      return {
        success: true,
        message: `${action === 'CHECK_IN' ? 'Check-in' : 'Check-out'} successful`,
        attendance
      };

    } catch (error) {
      // Log the full error for debugging
      this.logger.error('RFID scan error:', error);
      
      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Otherwise wrap it in an HttpException
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to process RFID scan'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 