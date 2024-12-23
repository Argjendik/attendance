import React, { useState, useEffect } from 'react';
import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Typography, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import EditAttendanceModal from './EditAttendanceModal';
import axios from 'axios';
import GetAppIcon from '@mui/icons-material/GetApp';

function AttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stats, setStats] = useState({
    totalRecords: 0,
    lateCheckins: 0,
    earlyDepartures: 0,
    onTime: 0
  });

  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get('/api/attendance', {
        params: {
          startDate,
          endDate,
          office: selectedOffice,
          status: selectedStatus
        }
      });
      setAttendanceData(response.data);
      
      // Calculate stats
      const records = response.data;
      setStats({
        totalRecords: records.length,
        lateCheckins: records.filter(r => r.status === 'LATE').length,
        earlyDepartures: records.filter(r => r.status === 'EARLY').length,
        onTime: records.filter(r => r.status === 'ON_TIME').length
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [startDate, endDate, selectedOffice, selectedStatus]);

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('/api/attendance/export', {
        params: {
          startDate,
          endDate,
          office: selectedOffice,
          status: selectedStatus
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const canEditAttendance = () => {
    const userRole = localStorage.getItem('role');
    return ['hr', 'admin', 'manager'].includes(userRole);
  };

  const handleEditClick = (attendance) => {
    setSelectedAttendance(attendance);
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async (updatedAttendance) => {
    try {
      await axios.put(`/api/attendance/${updatedAttendance._id}`, {
        checkIn: updatedAttendance.checkIn,
        checkOut: updatedAttendance.checkOut
      });
      
      toast.success('Attendance record updated successfully');
      fetchAttendanceData();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance record');
    }
  };

  const handleDeleteAttendance = async (attendanceId) => {
    try {
      await axios.delete(`/api/attendance/${attendanceId}`);
      toast.success('Attendance record deleted successfully');
      fetchAttendanceData();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record');
    }
  };

  const renderTableRows = () => {
    return attendanceData.map((attendance) => (
      <TableRow key={attendance._id}>
        <TableCell>{attendance.date}</TableCell>
        <TableCell>{attendance.agent}</TableCell>
        <TableCell>{attendance.office}</TableCell>
        <TableCell>{attendance.action}</TableCell>
        <TableCell>{attendance.time}</TableCell>
        <TableCell>
          <Box
            component="span"
            sx={{
              backgroundColor: attendance.status === 'LATE' ? '#dc3545' : '#198754',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            {attendance.status}
          </Box>
        </TableCell>
        <TableCell>{attendance.source}</TableCell>
        {canEditAttendance() && (
          <TableCell>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEditClick(attendance)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteAttendance(attendance._id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div>
      <h2>Attendance History</h2>
      
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          select
          label="Office"
          value={selectedOffice}
          onChange={(e) => setSelectedOffice(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Offices</MenuItem>
          <MenuItem value="Test">Test</MenuItem>
        </TextField>
        <TextField
          select
          label="Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="LATE">Late</MenuItem>
          <MenuItem value="ON_TIME">On Time</MenuItem>
          <MenuItem value="EARLY">Early</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4">{stats.totalRecords}</Typography>
          <Typography color="textSecondary">Total Records</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4">{stats.lateCheckins}</Typography>
          <Typography color="textSecondary">Late Check-ins</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4">{stats.earlyDepartures}</Typography>
          <Typography color="textSecondary">Early Departures</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4">{stats.onTime}</Typography>
          <Typography color="textSecondary">On Time</Typography>
        </Paper>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportCSV}
          startIcon={<GetAppIcon />}
        >
          Export CSV
        </Button>
      </Box>

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
              <TableCell>Source</TableCell>
              {canEditAttendance() && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableRows()}
          </TableBody>
        </Table>
      </TableContainer>

      <EditAttendanceModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        attendance={selectedAttendance}
        onUpdate={handleUpdateAttendance}
        onDelete={handleDeleteAttendance}
      />
    </div>
  );
}

export default AttendanceHistory; 