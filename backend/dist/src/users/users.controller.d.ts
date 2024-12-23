import { PrismaService } from '../prisma/prisma.service';
export declare class UsersController {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(req: any): Promise<{
        success: boolean;
        data: {
            user: {
                offices: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                role: string;
            };
        };
    }>;
    create(data: any): Promise<{
        success: boolean;
        data: {
            user: {
                offices: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                role: string;
            };
        };
    }>;
    findAll(): Promise<{
        success: boolean;
        data: {
            users: {
                offices: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                role: string;
            }[];
        };
    }>;
    updateRole(id: string, data: any): Promise<{
        success: boolean;
        data: {
            user: {
                offices: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                }[];
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                role: string;
            };
        };
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
