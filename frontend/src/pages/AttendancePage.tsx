import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button,
  OutlinedInput,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import dayjs from 'dayjs';
import api from '../services/api';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Office {
  id: number;
  name: string;
  location: string;
  expectedCheckIn: string;
  expectedCheckOut: string;
}

interface Agent {
  id: number;
  name: string;
  email: string | null;
  office: Office;
}

interface AttendanceRecord {
  id: number;
  agentId: number;
  agent: Agent;
  action: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  source: string;
  status: 'ON_TIME' | 'LATE' | 'EARLY';
  workingHours: number | null;
  lastCheckIn: string | null;
}

interface AttendanceStats {
  totalRecords: number;
  lateCheckIns: number;
  earlyDepartures: number;
  onTime: number;
}

interface AttendanceResponse {
  success: boolean;
  data: {
    records: AttendanceRecord[];
    stats: AttendanceStats;
  };
}

interface OfficeResponse {
  success: boolean;
  data: {
    offices: Office[];
  };
}

interface EditDialogProps {
  open: boolean;
  record: AttendanceRecord | null;
  onClose: () => void;
  onSave: (record: AttendanceRecord) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, record, onClose, onSave }) => {
  const [editedRecord, setEditedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (record) {
      const localTimestamp = dayjs(record.timestamp).format('YYYY-MM-DDTHH:mm');
      setEditedRecord({
        ...record,
        timestamp: localTimestamp
      });
    } else {
      setEditedRecord(null);
    }
  }, [record]);

  const handleSave = () => {
    if (editedRecord) {
      const utcTimestamp = dayjs(editedRecord.timestamp).toISOString();
      const updatedRecord = {
        ...editedRecord,
        timestamp: utcTimestamp
      };
      onSave(updatedRecord);
    }
  };

  if (!editedRecord) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Attendance Record</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Agent: {editedRecord.agent.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Action: {editedRecord.action}
          </Typography>
        </Box>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel shrink>Time</InputLabel>
          <OutlinedInput
            type="datetime-local"
            value={editedRecord.timestamp}
            onChange={(e) => {
              const newTimestamp = e.target.value;
              setEditedRecord(prev => prev ? {
                ...prev,
                timestamp: newTimestamp
              } : null);
            }}
            inputProps={{
              'aria-label': 'Time'
            }}
            fullWidth
          />
        </FormControl>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            value={editedRecord.status}
            onChange={(e) => {
              const newStatus = e.target.value as 'ON_TIME' | 'LATE' | 'EARLY';
              setEditedRecord(prev => prev ? {
                ...prev,
                status: newStatus
              } : null);
            }}
            label="Status"
          >
            <MenuItem value="ON_TIME">On Time</MenuItem>
            <MenuItem value="LATE">Late</MenuItem>
            <MenuItem value="EARLY">Early</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const userRole = localStorage.getItem('userRole');
  const userOfficeId = parseInt(localStorage.getItem('userOfficeId') || '0');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchAgent, setSearchAgent] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const { data: officesResponse, isLoading: isLoadingOffices } = useQuery<OfficeResponse>({
    queryKey: ['offices'],
    queryFn: async () => {
      const { data } = await api.get<OfficeResponse>('/offices');
      return data;
    },
  });

  const { data: attendanceData, isLoading: isLoadingAttendance, error } = useQuery<AttendanceResponse>({
    queryKey: ['attendance', startDate, endDate, selectedOffice, selectedStatus, searchAgent],
    queryFn: async () => {
      const params: any = {
        startDate: dayjs(startDate).startOf('day').toISOString(),
        endDate: dayjs(endDate).endOf('day').toISOString(),
      };

      if (selectedOffice) {
        params.officeId = selectedOffice;
      } else if (userRole === 'HR' && userOfficeId) {
        params.officeId = userOfficeId;
      }

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      if (searchAgent) {
        params.agentName = searchAgent;
      }

      const { data } = await api.get<AttendanceResponse>('/attendance', { params });
      return data;
    },
    refetchInterval: 5000,
  });

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleSave = async (updatedRecord: AttendanceRecord) => {
    try {
      await api.put(`/attendance/${updatedRecord.id}`, {
        timestamp: updatedRecord.timestamp,
        status: updatedRecord.status
      });
      
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      
      alert('Record updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      alert('Failed to update record');
      console.error('Error updating record:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await api.delete(`/attendance/${id}`);
      
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      
      alert('Record deleted successfully');
    } catch (error) {
      alert('Failed to delete record');
      console.error('Error deleting record:', error);
    }
  };

  const exportToCSV = () => {
    if (!attendanceData?.data?.records) return;

    const headers = ['Date', 'Agent', 'Office', 'Action', 'Time', 'Status', 'Working Hours', 'Source'];
    const data = attendanceData.data.records.map(record => [
      dayjs(record.timestamp).format('YYYY-MM-DD'),
      record.agent.name,
      record.agent.office.name,
      record.action,
      dayjs(record.timestamp).format('HH:mm:ss'),
      record.status,
      record.workingHours?.toFixed(2) || '',
      record.source
    ]);

    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${startDate}_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const { records = [], stats = { totalRecords: 0, lateCheckIns: 0, earlyDepartures: 0, onTime: 0 } } = attendanceData?.data || {};
  const offices = officesResponse?.data?.offices || [];

  // Get unique agent names and ensure they are strings
  const uniqueAgentNames = [...new Set(records.map(record => record.agent?.name))]
    .filter((name): name is string => typeof name === 'string')
    .sort();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance History
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl sx={{ width: 200 }}>
          <InputLabel shrink>Start Date</InputLabel>
          <OutlinedInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            notched
            sx={{ 
              backgroundColor: 'white',
              '& fieldset': { borderColor: '#ddd' }
            }}
          />
        </FormControl>

        <FormControl sx={{ width: 200 }}>
          <InputLabel shrink>End Date</InputLabel>
          <OutlinedInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            notched
            sx={{ 
              backgroundColor: 'white',
              '& fieldset': { borderColor: '#ddd' }
            }}
          />
        </FormControl>

        <FormControl sx={{ width: 200 }}>
          <Select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            displayEmpty
            input={<OutlinedInput />}
            sx={{ 
              backgroundColor: 'white',
              '& fieldset': { borderColor: '#ddd' },
              height: '56px'
            }}
          >
            <MenuItem value="">Office</MenuItem>
            {offices.map((office) => (
              <MenuItem key={office.id} value={office.id}>
                {office.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ width: 200 }}>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            displayEmpty
            input={<OutlinedInput />}
            sx={{ 
              backgroundColor: 'white',
              '& fieldset': { borderColor: '#ddd' },
              height: '56px'
            }}
          >
            <MenuItem value="">Status</MenuItem>
            <MenuItem value="ON_TIME">On Time</MenuItem>
            <MenuItem value="LATE">Late</MenuItem>
            <MenuItem value="EARLY">Early</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ width: 200 }}>
          <Select
            value={searchAgent}
            onChange={(e) => setSearchAgent(e.target.value)}
            displayEmpty
            input={<OutlinedInput />}
            sx={{ 
              backgroundColor: 'white',
              '& fieldset': { borderColor: '#ddd' },
              height: '56px'
            }}
          >
            <MenuItem value="">Filter by Agent</MenuItem>
            {uniqueAgentNames.map((agentName) => (
              <MenuItem key={agentName} value={agentName}>
                {agentName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4">{stats.totalRecords}</Typography>
          <Typography color="textSecondary">Total Records</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4">{stats.lateCheckIns}</Typography>
          <Typography color="textSecondary">Late Check-ins</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4">{stats.earlyDepartures}</Typography>
          <Typography color="textSecondary">Early Departures</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, textAlign: 'center' }}>
          <Typography variant="h4">{stats.onTime}</Typography>
          <Typography color="textSecondary">On Time</Typography>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          component={Link}
          to="/manual-check"
          sx={{
            backgroundColor: '#28a745',
            '&:hover': {
              backgroundColor: '#218838'
            }
          }}
        >
          MANUAL ENTRY
        </Button>
        <Button 
          variant="contained" 
          onClick={exportToCSV}
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          EXPORT CSV
        </Button>
      </Box>

      {records.length === 0 ? (
        <Alert severity="info">No attendance records found for the selected criteria.</Alert>
      ) : (
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
                        record.status === 'ON_TIME' ? 'success' :
                        record.status === 'LATE' ? 'error' :
                        'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {record.workingHours !== null ? `${record.workingHours.toFixed(2)} hrs` : '-'}
                  </TableCell>
                  <TableCell>{record.source}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(record)}
                      sx={{ mr: 1 }}
                      aria-label="Edit record"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(record.id)}
                      color="error"
                      aria-label="Delete record"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <EditDialog
        open={editDialogOpen}
        record={selectedRecord}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
};

export default AttendancePage; 