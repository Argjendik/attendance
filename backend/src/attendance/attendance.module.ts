import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
})
export class AttendanceModule {} 