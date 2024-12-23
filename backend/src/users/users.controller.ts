import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
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

    // Only include offices if officeIds is provided
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