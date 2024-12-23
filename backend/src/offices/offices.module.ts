import { Module } from '@nestjs/common';
import { OfficesController } from './offices.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OfficesController],
})
export class OfficesModule {} 