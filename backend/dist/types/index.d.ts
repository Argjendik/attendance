export type Role = 'ADMIN' | 'MANAGER' | 'HR' | 'AGENT';
export declare const ROLES: {
    readonly ADMIN: Role;
    readonly MANAGER: Role;
    readonly HR: Role;
    readonly AGENT: Role;
};
export interface JwtPayload {
    sub: number;
    email: string;
    role: Role;
    offices: number[];
}
export type AttendanceStatusType = 'ON_TIME' | 'LATE' | 'EARLY';
export type AttendanceActionType = 'CHECK_IN' | 'CHECK_OUT';
export type AttendanceSourceType = 'RFID' | 'MANUAL';
export declare function isValidRole(role: string): role is Role;
