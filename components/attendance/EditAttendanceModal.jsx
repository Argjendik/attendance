import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField 
} from '@mui/material';
import { toast } from 'react-toastify';

const EditAttendanceModal = ({ show, handleClose, attendance, onUpdate }) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    if (attendance) {
      setCheckIn(formatDateTime(attendance.checkIn));
      setCheckOut(attendance.checkOut ? formatDateTime(attendance.checkOut) : '');
    }
  }, [attendance]);

  const formatDateTime = (date) => {
    return new Date(date).toISOString().slice(0, 16);
  };

  const handleSubmit = () => {
    if (!checkIn) {
      toast.error('Check-in time is required');
      return;
    }

    onUpdate({
      ...attendance,
      checkIn: new Date(checkIn),
      checkOut: checkOut ? new Date(checkOut) : null,
    });
    handleClose();
  };

  return (
    <Dialog open={show} onClose={handleClose}>
      <DialogTitle>Edit Attendance Record</DialogTitle>
      <DialogContent>
        <TextField
          label="Check-in Time"
          type="datetime-local"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Check-out Time"
          type="datetime-local"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAttendanceModal; 