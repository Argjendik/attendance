import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { AgentsController } from './agents/agents.controller';
import { OfficesController } from './offices/offices.controller';
import { AttendanceController } from './attendance/attendance.controller';
import { RfidModule } from './rfid/rfid.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    RfidModule,
  ],
  controllers: [
    AppController,
    UsersController,
    AgentsController,
    OfficesController,
    AttendanceController,
  ],
})
export class AppModule {} 