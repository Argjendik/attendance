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
                    createdAt: Date;
                    updatedAt: Date;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                }[];
                id: number;
                email: string;
                name: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
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
                    createdAt: Date;
                    updatedAt: Date;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                }[];
                id: number;
                email: string;
                name: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
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
                    createdAt: Date;
                    updatedAt: Date;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                }[];
                id: number;
                email: string;
                name: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
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
                    createdAt: Date;
                    updatedAt: Date;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                }[];
                id: number;
                email: string;
                name: string;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
