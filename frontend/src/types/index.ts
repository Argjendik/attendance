export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  HR = 'HR',
  AGENT = 'AGENT'
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  offices: Office[];
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: number;
  name: string;
  location: string;
  checkInMethods: ('MANUAL' | 'RFID')[];
  expectedCheckIn: string;
  expectedCheckOut: string;
  createdAt: string;
  updatedAt: string;
  agents?: Agent[];
  users?: User[];
}

export interface Agent {
  id: number;
  name: string;
  rfidCode: string | null;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  officeId: number;
  office: Office;
  createdAt: string;
  updatedAt: string;
  attendanceRecords?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  agentId: number;
  action: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  source: 'RFID' | 'MANUAL';
  recordedBy?: string;
  agent: Agent;
  expectedIn: string;
  expectedOut: string;
  status: 'ON_TIME' | 'LATE' | 'EARLY';
  workingHours?: number;
}

export interface AttendanceStats {
  totalRecords: number;
  lateCheckIns: number;
  earlyDepartures: number;
  onTime: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface QueryResponse<T> {
  data: T;
  error?: string;
}

export interface BaseResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserProfileResponse extends BaseResponse<{
  user: User;
}> {}

export interface AttendanceResponse extends BaseResponse<{
  records: AttendanceRecord[];
  stats: AttendanceStats;
}> {}

export interface UserResponse extends BaseResponse<{
  users: User[];
}> {}

export interface OfficeResponse extends BaseResponse<{
  offices: Office[];
}> {}

export interface AgentResponse extends BaseResponse<{
  agents: Agent[];
}> {} 