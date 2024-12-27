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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficesController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_1 = require("../auth");
let OfficesController = class OfficesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOffice(data) {
        try {
            if (!data.name || !data.location) {
                throw new common_1.BadRequestException('Name and location are required');
            }
            const office = await this.prisma.office.create({
                data: {
                    name: data.name,
                    location: data.location,
                    checkInMethods: data.checkInMethods || ['MANUAL', 'RFID'],
                    expectedCheckIn: data.expectedCheckIn || '09:00',
                    expectedCheckOut: data.expectedCheckOut || '17:00',
                },
                include: {
                    agents: true,
                    users: true,
                },
            });
            return {
                success: true,
                data: {
                    office: office,
                },
                message: 'Office created successfully',
            };
        }
        catch (error) {
            console.error('Error creating office:', error);
            throw new common_1.BadRequestException('Failed to create office');
        }
    }
    async getOffices(req) {
        try {
            let offices;
            if (req.user.role === 'ADMIN') {
                offices = await this.prisma.office.findMany({
                    include: {
                        agents: true,
                        users: true,
                    },
                });
                return {
                    success: true,
                    data: {
                        offices: offices.map(office => ({
                            id: office.id,
                            name: office.name,
                            location: office.location,
                            checkInMethods: office.checkInMethods || ['MANUAL', 'RFID'],
                            expectedCheckIn: office.expectedCheckIn || '09:00',
                            expectedCheckOut: office.expectedCheckOut || '17:00',
                            agents: office.agents,
                            users: office.users
                        }))
                    }
                };
            }
            const userWithOffices = await this.prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    offices: {
                        include: {
                            agents: true,
                            users: true,
                        },
                    },
                },
            });
            if (!userWithOffices || !userWithOffices.offices) {
                return {
                    success: true,
                    data: {
                        offices: []
                    }
                };
            }
            const mappedOffices = userWithOffices.offices.map(office => ({
                id: office.id,
                name: office.name,
                location: office.location,
                checkInMethods: office.checkInMethods || ['MANUAL', 'RFID'],
                expectedCheckIn: office.expectedCheckIn || '09:00',
                expectedCheckOut: office.expectedCheckOut || '17:00',
                agents: office.agents,
                users: office.users
            }));
            return {
                success: true,
                data: {
                    offices: mappedOffices
                }
            };
        }
        catch (error) {
            console.error('Error fetching offices:', error);
            throw new common_1.BadRequestException('Failed to fetch offices');
        }
    }
    async updateOffice(id, data) {
        try {
            if (!data.name || !data.location) {
                throw new common_1.BadRequestException('Name and location are required');
            }
            const office = await this.prisma.office.update({
                where: { id: parseInt(id) },
                data: {
                    name: data.name,
                    location: data.location,
                    checkInMethods: data.checkInMethods,
                    expectedCheckIn: data.expectedCheckIn,
                    expectedCheckOut: data.expectedCheckOut,
                },
                include: {
                    agents: true,
                    users: true,
                },
            });
            return {
                success: true,
                data: {
                    office: office
                },
                message: 'Office updated successfully',
            };
        }
        catch (error) {
            console.error('Error updating office:', error);
            throw new common_1.BadRequestException('Failed to update office');
        }
    }
    async deleteOffice(id) {
        try {
            const officeId = parseInt(id);
            const office = await this.prisma.office.findUnique({
                where: { id: officeId },
                include: {
                    users: true,
                    agents: true,
                },
            });
            if (!office) {
                throw new common_1.BadRequestException('Office not found');
            }
            if (office.users.length > 0) {
                await this.prisma.office.update({
                    where: { id: officeId },
                    data: {
                        users: {
                            set: [],
                        },
                    },
                });
            }
            if (office.agents.length > 0) {
                const agentIds = office.agents.map(agent => agent.id);
                await this.prisma.attendanceRecord.deleteMany({
                    where: {
                        agentId: {
                            in: agentIds,
                        },
                    },
                });
            }
            await this.prisma.agent.deleteMany({
                where: {
                    officeId: officeId,
                },
            });
            await this.prisma.office.delete({
                where: { id: officeId },
            });
            return {
                success: true,
                message: 'Office deleted successfully',
            };
        }
        catch (error) {
            console.error('Error deleting office:', error);
            throw new common_1.BadRequestException('Failed to delete office. Please try again.');
        }
    }
};
exports.OfficesController = OfficesController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfficesController.prototype, "createOffice", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_1.Roles)('ADMIN', 'HR', 'MANAGER'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfficesController.prototype, "getOffices", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OfficesController.prototype, "updateOffice", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OfficesController.prototype, "deleteOffice", null);
exports.OfficesController = OfficesController = __decorate([
    (0, common_1.Controller)('offices'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OfficesController);
//# sourceMappingURL=offices.controller.js.map