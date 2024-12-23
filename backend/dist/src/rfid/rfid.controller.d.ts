import { PrismaService } from '../prisma/prisma.service';
type AttendanceSourceType = 'RFIDR' | 'RFIDO' | 'MANUAL';
export declare class RfidController {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkCard(cardNumber: string): Promise<{
        success: boolean;
        message: string;
        agent: {
            id: number;
            name: string;
            office: string;
        };
    }>;
    handleRfidScan(body: {
        cardNumber: string;
        timestamp?: string;
        source?: AttendanceSourceType;
    }): Promise<{
        success: boolean;
        message: string;
        attendance: any;
    }>;
}
export {};
