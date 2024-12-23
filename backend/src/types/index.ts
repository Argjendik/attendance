export type Role = 'ADMIN' | 'MANAGER' | 'HR' | 'AGENT';

export const ROLES = {
  ADMIN: 'ADMIN' as Role,
  MANAGER: 'MANAGER' as Role,
  HR: 'HR' as Role,
  AGENT: 'AGENT' as Role,
} as const;

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  offices: number[];
}

export type AttendanceStatusType = 'ON_TIME' | 'LATE' | 'EARLY';
export type AttendanceActionType = 'CHECK_IN' | 'CHECK_OUT';
export type AttendanceSourceType = 'RFID' | 'MANUAL';

export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}