import { PrismaService } from '../prisma/prisma.service';
export declare class AgentsController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(req: any, officeId?: string, officeIds?: string): Promise<{
        success: boolean;
        data: {
            agents: any;
        };
    }>;
    create(data: {
        name: string;
        rfidCode: string;
        officeId: number;
    }): Promise<{
        success: boolean;
        data: {
            agent: {
                office: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                rfidCode: string | null;
                status: string;
                officeId: number;
            };
        };
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: {
            agent: {
                office: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                rfidCode: string | null;
                status: string;
                officeId: number;
            };
        };
    }>;
    update(id: string, data: {
        name: string;
        rfidCode: string;
        officeId: number;
    }): Promise<{
        success: boolean;
        data: {
            agent: {
                office: {
                    id: number;
                    name: string;
                    location: string;
                    checkInMethods: string[];
                    expectedCheckIn: string;
                    expectedCheckOut: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                rfidCode: string | null;
                status: string;
                officeId: number;
            };
        };
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
