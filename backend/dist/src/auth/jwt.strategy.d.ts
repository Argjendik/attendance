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
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                rfidCode: string | null;
                status: string;
                officeId: number;
            }[];
        } & {
            id: number;
            name: string;
            location: string;
            checkInMethods: string[];
            expectedCheckIn: string;
            expectedCheckOut: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
}
export {};
