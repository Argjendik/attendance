import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      name: 'Attendance System API',
      version: '1.0.0',
      description: 'API for managing attendance records',
      endpoints: {
        auth: {
          login: 'POST /auth/login',
          rfid: 'POST /auth/rfid'
        },
        users: {
          profile: 'GET /users/profile',
          list: 'GET /users',
          create: 'POST /users',
          updateRole: 'PUT /users/:id/role',
          delete: 'DELETE /users/:id'
        },
        agents: {
          list: 'GET /agents',
          create: 'POST /agents',
          getOne: 'GET /agents/:id',
          update: 'PUT /agents/:id',
          delete: 'DELETE /agents/:id'
        },
        offices: {
          list: 'GET /offices',
          create: 'POST /offices',
          update: 'PUT /offices/:id',
          delete: 'DELETE /offices/:id'
        },
        attendance: {
          check: 'POST /attendance/check',
          list: 'GET /attendance',
          update: 'PUT /attendance/:id',
          delete: 'DELETE /attendance/:id',
          latestStatus: 'GET /attendance/latest-status'
        },
        rfid: {
          check: 'GET /api/rfid/check/:cardNumber',
          scan: 'POST /api/rfid/scan'
        }
      }
    };
  }
} 