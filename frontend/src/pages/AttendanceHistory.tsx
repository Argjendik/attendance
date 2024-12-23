import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Button,
  Avatar,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import AddIcon from '@mui/icons-material/Add';
import { AttendanceResponse, OfficeResponse, AgentResponse, AttendanceRecord, Office, Agent, UserProfileResponse } from '../types';

const AttendanceHistory: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const queryClient = useQueryClient();

  // Get current user profile to check role and managed offices
  const { data: userProfile } = useQuery<UserProfileResponse>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get<UserProfileResponse>('/users/profile');
      return data;
    },
  });

  // Get all offices
  const { data: officesResponse } = useQuery<OfficeResponse>({
    queryKey: ['offices'],
    queryFn: async () => {
      const { data } = await api.get<OfficeResponse>('/offices');
      return data;
    },
    enabled: !!userProfile && userProfile.data.user.role !== 'HR',
  });

  // Get agents based on user's role and office assignments
  const { data: agentsResponse } = useQuery<AgentResponse>({
    queryKey: ['agents', selectedOffice],
    queryFn: async () => {
      const { data } = await api.get<AgentResponse>('/agents', {
        params: {
          officeId: selectedOffice || undefined,
        },
      });
      return data;
    },
    enabled: !!userProfile,
  });

  // Get the list of offices the user has access to
  const availableOffices = React.useMemo<Office[]>(() => {
    if (!userProfile?.data?.user) return [];
    
    // For HR users, get their assigned offices from the profile
    if (userProfile.data.user.role === 'HR') {
      return userProfile.data.user.offices || [];
    }
    
    // For other roles, return all offices
    return officesResponse?.data?.offices || [];
  }, [userProfile?.data?.user, officesResponse?.data?.offices]);

  // Get the list of agents the user has access to
  const availableAgents = React.useMemo<Agent[]>(() => {
    if (!userProfile?.data?.user) return [];
    
    const agents = agentsResponse?.data?.agents || [];
    
    // If HR, only show agents from assigned offices
    if (userProfile.data.user.role === 'HR') {
      const assignedOfficeIds = new Set(userProfile.data.user.offices?.map(office => office.id) || []);
      return agents.filter(agent => assignedOfficeIds.has(agent.officeId));
    }
    
    return agents;
  }, [userProfile?.data?.user, agentsResponse?.data?.agents]);

  // For HR users with only one office, automatically select it
  React.useEffect(() => {
    if (userProfile?.data?.user?.role === 'HR' && userProfile.data.user.offices?.length === 1 && !selectedOffice) {
      setSelectedOffice(userProfile.data.user.offices[0].id.toString());
    }
  }, [userProfile?.data?.user, selectedOffice]);

  // Get attendance records
  const { data: attendanceResponse, isLoading, refetch: refetchAttendance } = useQuery<AttendanceResponse>({
    queryKey: ['attendance', startDate, endDate, selectedOffice, selectedStatus, selectedAgent],
    queryFn: async () => {
      console.log('Fetching attendance with params:', {
        startDate: dayjs(startDate).startOf('day').toISOString(),
        endDate: dayjs(endDate).endOf('day').toISOString(),
        officeId: selectedOffice,
        status: selectedStatus,
        agentId: selectedAgent,
      });

      const { data } = await api.get<AttendanceResponse>('/attendance', {
        params: {
          startDate: dayjs(startDate).startOf('day').toISOString(),
          endDate: dayjs(endDate).endOf('day').toISOString(),
          officeId: selectedOffice || undefined,
          status: selectedStatus || undefined,
          agentId: selectedAgent || undefined,
        },
      });
      console.log('Attendance response:', data);
      return data;
    },
    enabled: !!userProfile && (userProfile.data.user.role !== 'HR' || selectedOffice !== ''),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Effect to refetch data when component mounts
  React.useEffect(() => {
    refetchAttendance();
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (updatedRecord: AttendanceRecord) => {
      await api.put(`/attendance/${updatedRecord.id}`, {
        timestamp: updatedRecord.timestamp,
        status: updatedRecord.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Record updated successfully');
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update record');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Record deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete record');
    },
  });

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecord) {
      updateMutation.mutate(selectedRecord);
    }
  };

  const handleExport = () => {
    if (!attendanceResponse?.data?.records) return;

    const headers = ['Date', 'Agent', 'Office', 'Action', 'Time', 'Status', 'Working Hours', 'Source'];
    const data = attendanceResponse.data.records.map((record: AttendanceRecord) => [
      dayjs(record.timestamp).format('YYYY-MM-DD'),
      record.agent.name,
      record.agent.office.name,
      record.action,
      dayjs(record.timestamp).format('HH:mm:ss'),
      record.status,
      record.workingHours?.toFixed(2) || '',
      record.source,
    ]);

    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const records = attendanceResponse?.data?.records || [];
  const stats = attendanceResponse?.data?.stats || {
    totalRecords: 0,
    lateCheckIns: 0,
    earlyDepartures: 0,
    onTime: 0,
  };

  // If user is HR and has no offices assigned, show message
  if (userProfile?.data?.user?.role === 'HR' && (!userProfile.data.user.offices || userProfile.data.user.offices.length === 0)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Attendance History
        </Typography>
        <Typography color="error">
          You don't have any offices assigned. Please contact an administrator.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Attendance History</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<GetAppIcon />}
          onClick={handleExport}
          disabled={!records.length}
        >
          Export CSV
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Office</InputLabel>
              <Select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                label="Office"
              >
                <MenuItem value="">All Offices</MenuItem>
                {availableOffices.map((office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Agent</InputLabel>
              <Select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                label="Agent"
              >
                <MenuItem value="">All Agents</MenuItem>
                {availableAgents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h5">{stats.totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                On Time
              </Typography>
              <Typography variant="h5">{stats.onTime}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Late Check-ins
              </Typography>
              <Typography variant="h5">{stats.lateCheckIns}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Early Departures
              </Typography>
              <Typography variant="h5">{stats.earlyDepartures}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Office</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Working Hours</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{dayjs(record.timestamp).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{record.agent.name}</TableCell>
                <TableCell>{record.agent.office.name}</TableCell>
                <TableCell>{record.action}</TableCell>
                <TableCell>{dayjs(record.timestamp).format('HH:mm:ss')}</TableCell>
                <TableCell>
                  <Chip
                    label={record.status}
                    color={
                      record.status === 'ON_TIME'
                        ? 'success'
                        : record.status === 'LATE'
                        ? 'error'
                        : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>{record.workingHours?.toFixed(2) || '-'}</TableCell>
                <TableCell>{record.source}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(record)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(record.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <form onSubmit={handleUpdateRecord}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Timestamp"
              value={selectedRecord ? dayjs(selectedRecord.timestamp).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) =>
                setSelectedRecord(
                  selectedRecord
                    ? { ...selectedRecord, timestamp: e.target.value }
                    : null
                )
              }
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedRecord?.status || ''}
                onChange={(e) =>
                  setSelectedRecord(
                    selectedRecord
                      ? { ...selectedRecord, status: e.target.value as 'ON_TIME' | 'LATE' | 'EARLY' }
                      : null
                  )
                }
                label="Status"
              >
                <MenuItem value="ON_TIME">On Time</MenuItem>
                <MenuItem value="LATE">Late</MenuItem>
                <MenuItem value="EARLY">Early</MenuItem>
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRecord} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceHistory; 