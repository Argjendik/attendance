import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import { Role } from '../types';

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (data: any) => void;
  user: any;
  offices: any[];
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onClose,
  onUpdate,
  user,
  offices,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    assignedOffices: [] as any[],
  });

  // Reset form data when user changes or dialog opens
  useEffect(() => {
    if (user && open) {
      console.log('Setting form data with user:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        assignedOffices: user.assignedOffices || [],
      });
    }
  }, [user, open]);

  const handleSubmit = () => {
    console.log('Submitting form data:', formData);
    onUpdate({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      officeIds: formData.assignedOffices.map(office => office.id)
    });
  };

  const handleOfficesChange = (event: any) => {
    const selectedOfficeIds = event.target.value as number[];
    console.log('Selected office IDs:', selectedOfficeIds);
    
    // Map selected IDs to full office objects
    const selectedOffices = selectedOfficeIds
      .map(id => offices.find(office => office.id === id))
      .filter(Boolean);
    
    console.log('Selected offices:', selectedOffices);
    setFormData(prev => ({
      ...prev,
      assignedOffices: selectedOffices
    }));
  };

  const handleRoleChange = (newRole: string) => {
    console.log('Role changed to:', newRole);
    setFormData(prev => ({
      ...prev,
      role: newRole,
      assignedOffices: newRole === Role.HR ? prev.assignedOffices : []
    }));
  };

  const handleRemoveOffice = (officeId: number) => {
    console.log('Removing office:', officeId);
    setFormData(prev => ({
      ...prev,
      assignedOffices: prev.assignedOffices.filter(office => office.id !== officeId)
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              label="Role"
            >
              <MenuItem value={Role.ADMIN}>Admin</MenuItem>
              <MenuItem value={Role.HR}>HR</MenuItem>
              <MenuItem value={Role.MANAGER}>Manager</MenuItem>
            </Select>
          </FormControl>
          {formData.role === Role.HR && (
            <FormControl fullWidth>
              <InputLabel>Assigned Offices</InputLabel>
              <Select
                multiple
                value={formData.assignedOffices.map(office => office.id)}
                onChange={handleOfficesChange}
                label="Assigned Offices"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formData.assignedOffices.map((office) => (
                      <Chip 
                        key={office.id} 
                        label={office.name}
                        onDelete={() => handleRemoveOffice(office.id)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              >
                {offices.map((office) => (
                  <MenuItem 
                    key={office.id} 
                    value={office.id}
                    style={{
                      fontWeight: formData.assignedOffices.some(o => o.id === office.id)
                        ? 'bold'
                        : 'normal',
                    }}
                  >
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.name || !formData.email || !formData.role}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog; 