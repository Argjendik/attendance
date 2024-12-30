import { Controller, Post, Body, UnauthorizedException, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.authService.login(user);
  }

  @Post('rfid')
  @ApiOperation({ summary: 'RFID login', description: 'Login with RFID code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rfidCode: { type: 'string', example: 'ABC123' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid RFID code' })
  async rfidLogin(@Body() rfidDto: { rfidCode: string }) {
    const agent = await this.authService.validateAgent(rfidDto.rfidCode);
    return this.authService.login(agent);
  }

  @Post('init')
  @ApiOperation({ summary: 'Initialize system', description: 'Create initial admin user if no users exist' })
  @ApiResponse({ status: 200, description: 'Admin user created successfully' })
  @ApiResponse({ status: 400, description: 'Users already exist' })
  async initialize() {
    // Check if any users exist
    const userCount = await this.prisma.user.count();
    
    if (userCount > 0) {
      return { message: 'System is already initialized' };
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await this.prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN'
      }
    });

    const { password: _, ...result } = admin;
    
    return {
      message: 'Admin user created successfully',
      user: result,
      credentials: {
        email: 'admin@example.com',
        password: 'Admin123!'
      }
    };
  }
} 