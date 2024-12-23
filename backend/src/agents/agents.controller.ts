import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus, Request, BadRequestException, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';

@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'HR')
  async findAll(
    @Request() req,
    @Query('officeId') officeId?: string,
    @Query('officeIds') officeIds?: string,
  ) {
    try {
      let agents;
      const where: any = {};
      const include = {
        office: true,
      };

      if (req.user.role === 'ADMIN') {
        // Admin can see all agents from specified office(s) or all offices
        if (officeId) {
          where.officeId = parseInt(officeId);
        } else if (officeIds) {
          where.officeId = {
            in: officeIds.split(',').map(id => parseInt(id)),
          };
        }
      } else if (req.user.role === 'HR') {
        // HR can only see agents from their assigned offices
        const userWithOffices = await this.prisma.user.findUnique({
          where: { id: req.user.id },
          include: {
            offices: true,
          },
        });

        if (!userWithOffices || !userWithOffices.offices) {
          return { success: true, data: { agents: [] } };
        }

        // Get all office IDs assigned to the HR user
        const assignedOfficeIds = userWithOffices.offices.map(office => office.id);

        // If specific office is requested, make sure HR has access to it
        if (officeId) {
          const requestedOfficeId = parseInt(officeId);
          if (!assignedOfficeIds.includes(requestedOfficeId)) {
            throw new HttpException('Unauthorized access to office', HttpStatus.FORBIDDEN);
          }
          where.officeId = requestedOfficeId;
        } else {
          // Otherwise, show agents from all assigned offices
          where.officeId = {
            in: assignedOfficeIds,
          };
        }
      } else {
        // Manager role - can see all agents or filter by office
        if (officeId) {
          where.officeId = parseInt(officeId);
        } else if (officeIds) {
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
    } catch (error) {
      console.error('Error fetching agents:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch agents');
    }
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: { name: string; rfidCode: string; officeId: number }) {
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'RFID code already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to create agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: parseInt(id) },
        include: {
          office: true,
        },
      });

      if (!agent) {
        throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          agent,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() data: { name: string; rfidCode: string; officeId: number }
  ) {
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'RFID code already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to update agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    try {
      await this.prisma.agent.delete({
        where: { id: parseInt(id) },
      });
      return {
        success: true,
        message: 'Agent deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to delete agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 