import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        id: number;
        email: string;
        role: string;
        offices: ({
            agents: {
                id: number;
                name: string;
                rfidCode: string | null;
                email: string | null;
                status: string;
                officeId: number;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            location: string;
            checkInMethods: string[];
            expectedCheckIn: string;
            expectedCheckOut: string;
        })[];
    }>;
}
export {};
