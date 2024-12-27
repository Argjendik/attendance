"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RfidController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfidController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dayjs = require("dayjs");
let RfidController = RfidController_1 = class RfidController {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RfidController_1.name);
    }
    async checkCard(cardNumber) {
        try {
            if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.length < 4) {
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Invalid card number format'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
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
                                equals: cardNumber.replace(/^0+/, ''),
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
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: 'No agent found with this RFID card'
                }, common_1.HttpStatus.NOT_FOUND);
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
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to check card registration'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleRfidScan(body) {
        try {
            const { cardNumber, timestamp, source } = body;
            if (!cardNumber || typeof cardNumber !== 'string' || cardNumber.length < 4) {
                this.logger.warn(`Invalid card number format received: ${cardNumber}`);
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Invalid card number format'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const recordSource = source || 'RFIDR';
            this.logger.debug(`Received RFID scan request with card number: ${cardNumber}, source: ${recordSource}`);
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
                                    equals: cardNumber.replace(/^0+/, ''),
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
                    throw new common_1.HttpException({
                        statusCode: common_1.HttpStatus.NOT_FOUND,
                        message: 'No agent found with this RFID card'
                    }, common_1.HttpStatus.NOT_FOUND);
                }
            }
            catch (dbError) {
                this.logger.error('Database error while finding agent:', dbError);
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error while finding agent'
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const scanTime = timestamp ? new Date(timestamp) : new Date();
            const scanDay = dayjs(scanTime);
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
            }
            catch (dbError) {
                this.logger.error('Database error while finding last record:', dbError);
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error while finding last attendance record'
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const action = !lastRecord || lastRecord.action === 'CHECK_OUT' ? 'CHECK_IN' : 'CHECK_OUT';
            this.logger.debug(`Determined action: ${action}`);
            const expectedIn = agent.office.expectedCheckIn;
            const expectedOut = agent.office.expectedCheckOut;
            let status = 'ON_TIME';
            const scanDayjs = dayjs(scanTime);
            try {
                if (action === 'CHECK_IN') {
                    const [hour, minute] = expectedIn.split(':').map(Number);
                    const startTime = scanDayjs.hour(hour).minute(minute).second(0);
                    this.logger.debug(`Check-in comparison - Scan time: ${scanDayjs.format('HH:mm:ss')}, Expected: ${startTime.format('HH:mm:ss')}`);
                    const lateThreshold = startTime.add(5, 'minute');
                    if (scanDayjs.isAfter(lateThreshold)) {
                        status = 'LATE';
                    }
                }
                else if (action === 'CHECK_OUT') {
                    const [hour, minute] = expectedOut.split(':').map(Number);
                    const endTime = scanDayjs.hour(hour).minute(minute).second(0);
                    this.logger.debug(`Check-out comparison - Scan time: ${scanDayjs.format('HH:mm:ss')}, Expected: ${endTime.format('HH:mm:ss')}`);
                    const earlyThreshold = endTime.subtract(5, 'minute');
                    if (scanDayjs.isBefore(earlyThreshold)) {
                        status = 'EARLY';
                    }
                }
                this.logger.debug(`Determined status: ${status}`);
            }
            catch (timeError) {
                this.logger.error('Error calculating attendance status:', timeError);
                status = 'ON_TIME';
            }
            let workingHours = null;
            if (action === 'CHECK_OUT' && lastRecord) {
                const checkInTime = new Date(lastRecord.timestamp);
                workingHours = (scanTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
            }
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
            }
            catch (dbError) {
                this.logger.error('Database error while creating attendance record:', dbError);
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error while creating attendance record'
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            this.logger.log(`${agent.name}: ${action} (${status})`);
            return {
                success: true,
                message: `${action === 'CHECK_IN' ? 'Check-in' : 'Check-out'} successful`,
                attendance
            };
        }
        catch (error) {
            this.logger.error('RFID scan error:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to process RFID scan'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.RfidController = RfidController;
__decorate([
    (0, common_1.Get)('check/:cardNumber'),
    __param(0, (0, common_1.Param)('cardNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RfidController.prototype, "checkCard", null);
__decorate([
    (0, common_1.Post)('scan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RfidController.prototype, "handleRfidScan", null);
exports.RfidController = RfidController = RfidController_1 = __decorate([
    (0, common_1.Controller)('api/rfid'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RfidController);
//# sourceMappingURL=rfid.controller.js.map