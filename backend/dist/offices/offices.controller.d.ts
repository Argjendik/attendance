import { PrismaService } from '../prisma/prisma.service';
export declare class OfficesController {
    private prisma;
    constructor(prisma: PrismaService);
    createOffice(data: any): Promise<{
        success: boolean;
        data: {
            office: {
                agents: {
                    id: number;
                    email: string | null;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    rfidCode: string | null;
                    status: string;
                    officeId: number;
                }[];
                users: {
                    id: number;
                    email: string;
                    password: string;
                    name: string;
                    role: string;
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
            };
        };
        message: string;
    }>;
    getOffices(req: any): Promise<{
        success: boolean;
        data: {
            offices: any;
        };
    }>;
    updateOffice(id: string, data: any): Promise<{
        success: boolean;
        data: {
            office: {
                agents: {
                    id: number;
                    email: string | null;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    rfidCode: string | null;
                    status: string;
                    officeId: number;
                }[];
                users: {
                    id: number;
                    email: string;
                    password: string;
                    name: string;
                    role: string;
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
            };
        };
        message: string;
    }>;
    deleteOffice(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
