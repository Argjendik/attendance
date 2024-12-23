import { Module } from '@nestjs/common';
import { RfidController } from './rfid.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RfidController],
})
export class RfidModule {} 