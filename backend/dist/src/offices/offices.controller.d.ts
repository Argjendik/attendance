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
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    rfidCode: string | null;
                    status: string;
                    officeId: number;
                }[];
                users: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    password: string;
                    role: string;
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
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    rfidCode: string | null;
                    status: string;
                    officeId: number;
                }[];
                users: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    password: string;
                    role: string;
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
            };
        };
        message: string;
    }>;
    deleteOffice(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
