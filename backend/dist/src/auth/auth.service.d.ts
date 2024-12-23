import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            offices: any;
        };
    }>;
    validateAgent(rfidCode: string): Promise<{
        office: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            location: string;
            checkInMethods: string[];
            expectedCheckIn: string;
            expectedCheckOut: string;
        };
    } & {
        id: number;
        name: string;
        rfidCode: string | null;
        email: string | null;
        status: string;
        officeId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
