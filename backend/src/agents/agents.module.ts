import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentsController],
})
export class AgentsModule {} 