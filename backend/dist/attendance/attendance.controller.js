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
var AttendanceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_1 = require("../auth");
let AttendanceController = AttendanceController_1 = class AttendanceController {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AttendanceController_1.name);
    }
    async checkAttendance(data, req) {
        try {
            this.logger.log('Received attendance check request:', data);
            let agent;
            if (data.agentId) {
                agent = await this.prisma.agent.findUnique({
                    where: { id: parseInt(data.agentId) },
                    include: {
                        office: true,
                    },
                });
            }
            else if (data.rfidCode) {
                agent = await this.prisma.agent.findUnique({
                    where: { rfidCode: data.rfidCode },
                    include: {
                        office: true,
                    },
                });
            }
            if (!agent) {
                throw new common_1.NotFoundException('Agent not found');
            }
            const recordingUser = await this.prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    offices: true,
                },
            });
            if (recordingUser.role === 'HR') {
                const hasAccess = recordingUser.offices.some(office => office.id === agent.officeId);
                if (!hasAccess) {
                    throw new common_1.UnauthorizedException('You can only record attendance for agents in your assigned offices');
                }
            }
            const now = data.timestamp ? new Date(data.timestamp) : new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
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
            if (data.action === 'CHECK_IN' && existingRecords.length > 0 && existingRecords[0].action === 'CHECK_IN') {
                throw new common_1.BadRequestException('Agent is already checked in');
            }
            if (data.action === 'CHECK_OUT' && (existingRecords.length === 0 || existingRecords[0].action === 'CHECK_OUT')) {
                throw new common_1.BadRequestException('Agent must check in first');
            }
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
        }
        catch (error) {
            this.logger.error('Error creating attendance record:', error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to create attendance record. Please check your input.');
        }
    }
    calculateStatus(timestamp, action, office) {
        const time = timestamp.getHours() * 60 + timestamp.getMinutes();
        if (action === 'CHECK_IN') {
            const [expectedHour, expectedMinute] = office.expectedCheckIn.split(':').map(Number);
            const expectedTime = expectedHour * 60 + expectedMinute;
            return time <= expectedTime ? 'ON_TIME' : 'LATE';
        }
        else {
            const [expectedHour, expectedMinute] = office.expectedCheckOut.split(':').map(Number);
            const expectedTime = expectedHour * 60 + expectedMinute;
            return time >= expectedTime ? 'ON_TIME' : 'EARLY';
        }
    }
    async getAttendanceRecords(query, req) {
        try {
            this.logger.log('Getting attendance records with query:', query);
            this.logger.log('User:', req.user);
            const where = {};
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
        }
        catch (error) {
            this.logger.error('Error getting attendance records:', error);
            throw new common_1.BadRequestException('Failed to get attendance records');
        }
    }
    async updateAttendanceRecord(id, data, req) {
        try {
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
                throw new common_1.NotFoundException('Attendance record not found');
            }
            if (req.user.role === 'HR') {
                const user = await this.prisma.user.findUnique({
                    where: { id: req.user.id },
                    include: { offices: true },
                });
                const hasAccess = user.offices.some(office => office.id === existingRecord.agent.officeId);
                if (!hasAccess) {
                    throw new common_1.UnauthorizedException('You can only edit attendance records for agents in your assigned offices');
                }
            }
            const timestamp = data.timestamp ? new Date(data.timestamp) : existingRecord.timestamp;
            const status = data.status || existingRecord.status;
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
        }
        catch (error) {
            console.error('Error updating attendance record:', error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to update attendance record');
        }
    }
    async deleteAttendanceRecord(id, req) {
        try {
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
                throw new common_1.NotFoundException('Attendance record not found');
            }
            if (req.user.role === 'HR') {
                const user = await this.prisma.user.findUnique({
                    where: { id: req.user.id },
                    include: { offices: true },
                });
                const hasAccess = user.offices.some(office => office.id === existingRecord.agent.officeId);
                if (!hasAccess) {
                    throw new common_1.UnauthorizedException('You can only delete attendance records for agents in your assigned offices');
                }
            }
            await this.prisma.attendanceRecord.delete({
                where: { id: parseInt(id) },
            });
            return {
                success: true,
                message: 'Record deleted successfully',
            };
        }
        catch (error) {
            console.error('Error deleting attendance record:', error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to delete attendance record');
        }
    }
    async getLatestStatus(req) {
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
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
            }
            else {
                agents = await this.prisma.agent.findMany();
            }
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
        }
        catch (error) {
            this.logger.error('Error fetching latest attendance status:', error);
            throw new common_1.BadRequestException('Failed to fetch attendance status');
        }
    }
    calculateWorkingHours(checkInTime, checkOutTime) {
        if (!checkInTime || !checkOutTime) {
            return null;
        }
        const diffInMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
        return Math.round(diffInHours * 100) / 100;
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check'),
    (0, auth_1.Roles)('ADMIN', 'HR', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkAttendance", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_1.Roles)('ADMIN', 'MANAGER', 'HR'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceRecords", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_1.Roles)('ADMIN', 'HR', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "updateAttendanceRecord", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_1.Roles)('ADMIN', 'HR', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "deleteAttendanceRecord", null);
__decorate([
    (0, common_1.Get)('latest-status'),
    (0, auth_1.Roles)('ADMIN', 'HR', 'MANAGER'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getLatestStatus", null);
exports.AttendanceController = AttendanceController = AttendanceController_1 = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map