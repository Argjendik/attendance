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
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_1 = require("../auth");
let AgentsController = class AgentsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(req, officeId, officeIds) {
        try {
            let agents;
            const where = {};
            const include = {
                office: true,
            };
            if (req.user.role === 'ADMIN') {
                if (officeId) {
                    where.officeId = parseInt(officeId);
                }
                else if (officeIds) {
                    where.officeId = {
                        in: officeIds.split(',').map(id => parseInt(id)),
                    };
                }
            }
            else if (req.user.role === 'HR') {
                const userWithOffices = await this.prisma.user.findUnique({
                    where: { id: req.user.id },
                    include: {
                        offices: true,
                    },
                });
                if (!userWithOffices || !userWithOffices.offices) {
                    return { success: true, data: { agents: [] } };
                }
                const assignedOfficeIds = userWithOffices.offices.map(office => office.id);
                if (officeId) {
                    const requestedOfficeId = parseInt(officeId);
                    if (!assignedOfficeIds.includes(requestedOfficeId)) {
                        throw new common_1.HttpException('Unauthorized access to office', common_1.HttpStatus.FORBIDDEN);
                    }
                    where.officeId = requestedOfficeId;
                }
                else {
                    where.officeId = {
                        in: assignedOfficeIds,
                    };
                }
            }
            else {
                if (officeId) {
                    where.officeId = parseInt(officeId);
                }
                else if (officeIds) {
                    where.officeId = {
                        in: officeIds.split(',').map(id => parseInt(id)),
                    };
                }
            }
            agents = await this.prisma.agent.findMany({
                where,
                include,
                orderBy: {
                    name: 'asc',
                },
            });
            return {
                success: true,
                data: {
                    agents,
                },
            };
        }
        catch (error) {
            console.error('Error fetching agents:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to fetch agents');
        }
    }
    async create(data) {
        try {
            const agent = await this.prisma.agent.create({
                data: {
                    name: data.name,
                    rfidCode: data.rfidCode || null,
                    office: {
                        connect: {
                            id: data.officeId,
                        },
                    },
                },
                include: {
                    office: true,
                },
            });
            return {
                success: true,
                data: {
                    agent,
                },
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.HttpException('RFID code already exists', common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException('Failed to create agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            const agent = await this.prisma.agent.findUnique({
                where: { id: parseInt(id) },
                include: {
                    office: true,
                },
            });
            if (!agent) {
                throw new common_1.HttpException('Agent not found', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: {
                    agent,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to fetch agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async update(id, data) {
        try {
            const agent = await this.prisma.agent.update({
                where: { id: parseInt(id) },
                data: {
                    name: data.name,
                    rfidCode: data.rfidCode || null,
                    office: {
                        connect: {
                            id: data.officeId,
                        },
                    },
                },
                include: {
                    office: true,
                },
            });
            return {
                success: true,
                data: {
                    agent,
                },
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.HttpException('RFID code already exists', common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException('Failed to update agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async delete(id) {
        try {
            await this.prisma.agent.delete({
                where: { id: parseInt(id) },
            });
            return {
                success: true,
                message: 'Agent deleted successfully',
            };
        }
        catch (error) {
            throw new common_1.HttpException('Failed to delete agent', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_1.Roles)('ADMIN', 'MANAGER', 'HR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('officeId')),
    __param(2, (0, common_1.Query)('officeIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "delete", null);
exports.AgentsController = AgentsController = __decorate([
    (0, common_1.Controller)('agents'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentsController);
//# sourceMappingURL=agents.controller.js.map