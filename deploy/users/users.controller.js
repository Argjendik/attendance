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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_1 = require("../auth");
const bcrypt = require("bcrypt");
const swagger_1 = require("@nestjs/swagger");
let UsersController = class UsersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(req) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    offices: true,
                },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            const { password: _, ...result } = user;
            return {
                success: true,
                data: {
                    user: result
                }
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to fetch user profile');
        }
    }
    async create(data) {
        if (!data.email || !data.password || !data.name || !data.role) {
            throw new common_1.BadRequestException('Missing required fields: email, password, name, role');
        }
        const userData = {
            email: data.email,
            password: await bcrypt.hash(data.password, 10),
            name: data.name,
            role: data.role,
        };
        if (data.officeIds && Array.isArray(data.officeIds)) {
            Object.assign(userData, {
                offices: {
                    connect: data.officeIds.map((id) => ({ id }))
                }
            });
        }
        const user = await this.prisma.user.create({
            data: userData,
            include: {
                offices: true,
            },
        });
        const { password: _, ...result } = user;
        return {
            success: true,
            data: {
                user: result
            }
        };
    }
    async findAll() {
        const users = await this.prisma.user.findMany({
            include: {
                offices: true,
            },
        });
        const sanitizedUsers = users.map(user => {
            const { password: _, ...result } = user;
            return result;
        });
        return {
            success: true,
            data: {
                users: sanitizedUsers
            }
        };
    }
    async updateRole(id, data) {
        if (!data.role) {
            throw new common_1.BadRequestException('Role is required');
        }
        const updateData = {
            role: data.role,
        };
        if (data.officeIds && Array.isArray(data.officeIds)) {
            updateData.offices = {
                set: data.officeIds.map((id) => ({ id }))
            };
        }
        const user = await this.prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                offices: true,
            },
        });
        const { password: _, ...result } = user;
        return {
            success: true,
            data: {
                user: result
            }
        };
    }
    async deleteUser(id) {
        await this.prisma.user.delete({
            where: { id: parseInt(id) },
        });
        return {
            success: true,
            message: 'User deleted successfully'
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile', description: 'Get the profile of the currently logged-in user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create user', description: 'Create a new user (Admin only)' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'password', 'name', 'role'],
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', enum: ['ADMIN', 'HR', 'MANAGER'], example: 'HR' },
                officeIds: { type: 'array', items: { type: 'number' }, example: [1, 2] }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin only' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users', description: 'Get a list of all users (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin only' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id/role'),
    (0, auth_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user role', description: 'Update a user\'s role and office assignments (Admin only)' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['role'],
            properties: {
                role: { type: 'string', enum: ['ADMIN', 'HR', 'MANAGER'], example: 'HR' },
                officeIds: { type: 'array', items: { type: 'number' }, example: [1, 2] }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User role updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin only' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user', description: 'Delete a user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin only' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map