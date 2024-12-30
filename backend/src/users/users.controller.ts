import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';
import * as bcrypt from 'bcryptjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile', description: 'Get the profile of the currently logged-in user' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          offices: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const { password: _, ...result } = user;
      return {
        success: true,
        data: {
          user: result
        }
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch user profile');
    }
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create user', description: 'Create a new user (Admin only)' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(@Body() data: any) {
    if (!data.email || !data.password || !data.name || !data.role) {
      throw new BadRequestException('Missing required fields: email, password, name, role');
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
          connect: data.officeIds.map((id: number) => ({ id }))
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

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users', description: 'Get a list of all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
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

  @Put(':id/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user role', description: 'Update a user\'s role and office assignments (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: {
        role: { type: 'string', enum: ['ADMIN', 'HR', 'MANAGER'], example: 'HR' },
        officeIds: { type: 'array', items: { type: 'number' }, example: [1, 2] }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateRole(@Param('id') id: string, @Body() data: any) {
    if (!data.role) {
      throw new BadRequestException('Role is required');
    }

    const updateData: any = {
      role: data.role,
    };

    if (data.officeIds && Array.isArray(data.officeIds)) {
      updateData.offices = {
        set: data.officeIds.map((id: number) => ({ id }))
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

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user', description: 'Delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return {
      success: true,
      message: 'User deleted successfully'
    };
  }
} 