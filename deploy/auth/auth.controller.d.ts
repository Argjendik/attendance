import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthController {
    private authService;
    private prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            offices: any;
        };
    }>;
    rfidLogin(rfidDto: {
        rfidCode: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            offices: any;
        };
    }>;
    initialize(): Promise<{
        message: string;
        user?: undefined;
        credentials?: undefined;
    } | {
        message: string;
        user: {
            id: number;
            email: string;
            name: string;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        };
        credentials: {
            email: string;
            password: string;
        };
    }>;
}
