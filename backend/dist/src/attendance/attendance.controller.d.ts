import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceController {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkAttendance(data: any, req: any): Promise<{
        success: boolean;
        data: {
            agent: {
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
                status: string;
                email: string | null;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                rfidCode: string | null;
                officeId: number;
            };
        } & {
            id: number;
            agentId: number;
            action: string;
            timestamp: Date;
            source: string;
            recordedBy: string | null;
            expectedIn: string;
            expectedOut: string;
            status: string | null;
            lastCheckIn: Date | null;
            workingHours: number | null;
        };
        message: string;
    }>;
    private calculateStatus;
    getAttendanceRecords(query: {
        startDate?: string;
        endDate?: string;
        officeId?: string;
        status?: string;
        agentId?: string;
    }, req: any): Promise<{
        success: boolean;
        data: {
            records: ({
                agent: {
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
                    status: string;
                    email: string | null;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    rfidCode: string | null;
                    officeId: number;
                };
            } & {
                id: number;
                agentId: number;
                action: string;
                timestamp: Date;
                source: string;
                recordedBy: string | null;
                expectedIn: string;
                expectedOut: string;
                status: string | null;
                lastCheckIn: Date | null;
                workingHours: number | null;
            })[];
            stats: {
                totalRecords: number;
                lateCheckIns: number;
                earlyDepartures: number;
                onTime: number;
            };
        };
    }>;
    updateAttendanceRecord(id: string, data: {
        timestamp?: string;
        status?: string;
    }, req: any): Promise<{
        success: boolean;
        data: {
            agent: {
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
                status: string;
                email: string | null;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                rfidCode: string | null;
                officeId: number;
            };
        } & {
            id: number;
            agentId: number;
            action: string;
            timestamp: Date;
            source: string;
            recordedBy: string | null;
            expectedIn: string;
            expectedOut: string;
            status: string | null;
            lastCheckIn: Date | null;
            workingHours: number | null;
        };
        message: string;
    }>;
    deleteAttendanceRecord(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getLatestStatus(req: any): Promise<{
        success: boolean;
        data: {
            statuses: {};
        };
    }>;
    private calculateWorkingHours;
}
