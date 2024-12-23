import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth';

@Controller('offices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OfficesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @Roles('ADMIN')
  async createOffice(@Body() data: any) {
    try {
      if (!data.name || !data.location) {
        throw new BadRequestException('Name and location are required');
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
    } catch (error) {
      console.error('Error creating office:', error);
      throw new BadRequestException('Failed to create office');
    }
  }

  @Get()
  @Roles('ADMIN', 'HR', 'MANAGER')
  async getOffices(@Request() req) {
    try {
      let offices;
      
      if (req.user.role === 'ADMIN') {
        // Admin can see all offices
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
      
      // HR users - get their assigned offices with agents
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

      // For HR users, return both offices and their agents
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
      
    } catch (error) {
      console.error('Error fetching offices:', error);
      throw new BadRequestException('Failed to fetch offices');
    }
  }

  @Put(':id')
  @Roles('ADMIN')
  async updateOffice(@Param('id') id: string, @Body() data: any) {
    try {
      if (!data.name || !data.location) {
        throw new BadRequestException('Name and location are required');
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
    } catch (error) {
      console.error('Error updating office:', error);
      throw new BadRequestException('Failed to update office');
    }
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteOffice(@Param('id') id: string) {
    try {
      const officeId = parseInt(id);
      
      // Get all users associated with this office
      const office = await this.prisma.office.findUnique({
        where: { id: officeId },
        include: {
          users: true,
          agents: true,
        },
      });

      if (!office) {
        throw new BadRequestException('Office not found');
      }

      // First, update all users to remove this office from their offices array
      if (office.users.length > 0) {
        await this.prisma.office.update({
          where: { id: officeId },
          data: {
            users: {
              set: [], // Remove all user connections
            },
          },
        });
      }

      // Then delete all attendance records for agents in this office
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

      // Delete all agents in this office
      await this.prisma.agent.deleteMany({
        where: {
          officeId: officeId,
        },
      });

      // Finally delete the office
      await this.prisma.office.delete({
        where: { id: officeId },
      });

      return {
        success: true,
        message: 'Office deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting office:', error);
      throw new BadRequestException('Failed to delete office. Please try again.');
    }
  }
} 