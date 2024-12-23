import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const AdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userDialog, setUserDialog] = useState(false);
  const [officeDialog, setOfficeDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editOfficeDialog, setEditOfficeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedOffice, setSelectedOffice] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'HR',
    officeIds: [] as number[],
  });
  const [newOffice, setNewOffice] = useState({
    name: '',
    location: '',
    checkInMethods: ['MANUAL', 'RFID'],
    expectedCheckIn: '09:00',
    expectedCheckOut: '17:00',
  });

  const queryClient = useQueryClient();

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      console.log('Users response:', data);
      return data;
    }
  });

  const { data: officesResponse } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const { data } = await api.get('/offices');
      console.log('Offices response:', data);
      return data;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data } = await api.post('/users', userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDialog(false);
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'HR',
        officeIds: [],
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.put(`/users/${userData.id}/role`, {
        role: userData.role,
        officeIds: userData.officeIds,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUserDialog(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const createOfficeMutation = useMutation({
    mutationFn: async (officeData: typeof newOffice) => {
      const { data } = await api.post('/offices', officeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      setOfficeDialog(false);
      setNewOffice({
        name: '',
        location: '',
        checkInMethods: ['MANUAL', 'RFID'],
        expectedCheckIn: '09:00',
        expectedCheckOut: '17:00',
      });
    },
  });

  const updateOfficeMutation = useMutation({
    mutationFn: async (officeData: any) => {
      const { data } = await api.put(`/offices/${officeData.id}`, officeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      setEditOfficeDialog(false);
      setSelectedOffice(null);
    },
  });

  const deleteOfficeMutation = useMutation({
    mutationFn: async (officeId: number) => {
      await api.delete(`/offices/${officeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser({
      ...user,
      officeIds: user.offices.map((o: any) => o.id),
    });
    setEditUserDialog(true);
  };

  const handleEditOffice = (office: any) => {
    setSelectedOffice(office);
    setEditOfficeDialog(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeleteOffice = (officeId: number) => {
    if (window.confirm('Are you sure you want to delete this office?')) {
      deleteOfficeMutation.mutate(officeId);
    }
  };

  const users = usersResponse?.data?.users || [];
  const offices = officesResponse?.data?.offices || [];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Users" />
          <Tab label="Offices" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3 }}>
        {tabValue === 0 && (
          <>
            <Button variant="contained" onClick={() => setUserDialog(true)} sx={{ mb: 2 }}>
              Add New User
            </Button>
            <Grid container spacing={2}>
              {users.map((user) => (
                <Grid item xs={12} md={6} key={user.id}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">{user.name}</Typography>
                        <Typography color="textSecondary">{user.email}</Typography>
                        <Chip label={user.role} color="primary" sx={{ mt: 1 }} />
                        {user.offices && user.offices.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">Offices:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {user.offices.map((office) => (
                                <Chip key={office.id} label={office.name} size="small" />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditUser(user)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {tabValue === 1 && (
          <>
            <Button variant="contained" onClick={() => setOfficeDialog(true)} sx={{ mb: 2 }}>
              Add New Office
            </Button>
            <Grid container spacing={2}>
              {offices.map((office) => (
                <Grid item xs={12} md={6} key={office.id}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">{office.name}</Typography>
                        <Typography color="textSecondary">{office.location}</Typography>
                        <Box sx={{ mt: 1 }}>
                          {office.checkInMethods.map((method) => (
                            <Chip key={method} label={method} sx={{ mr: 1 }} />
                          ))}
                        </Box>
                        <Typography sx={{ mt: 1 }}>
                          Working Hours: {office.expectedCheckIn} - {office.expectedCheckOut}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditOffice(office)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteOffice(office.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>

      {/* New User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="HR">HR</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
            </Select>
          </FormControl>
          {newUser.role === 'HR' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Assigned Offices</InputLabel>
              <Select
                multiple
                value={newUser.officeIds}
                onChange={(e) => setNewUser({ ...newUser, officeIds: e.target.value as number[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const office = offices.find((o) => o.id === id);
                      return office ? (
                        <Chip key={id} label={office.name} />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {offices.map((office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button onClick={() => createUserMutation.mutate(newUser)}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={selectedUser?.name || ''}
            disabled
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={selectedUser?.email || ''}
            disabled
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedUser?.role || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
            >
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="HR">HR</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
            </Select>
          </FormControl>
          {selectedUser?.role === 'HR' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Assigned Offices</InputLabel>
              <Select
                multiple
                value={selectedUser?.officeIds || []}
                onChange={(e) => setSelectedUser({ ...selectedUser, officeIds: e.target.value as number[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id: number) => {
                      const office = offices.find((o) => o.id === id);
                      return office ? (
                        <Chip key={id} label={office.name} />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {offices.map((office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button onClick={() => updateUserMutation.mutate(selectedUser)}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* New Office Dialog */}
      <Dialog open={officeDialog} onClose={() => setOfficeDialog(false)}>
        <DialogTitle>Add New Office</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newOffice.name}
            onChange={(e) => setNewOffice({ ...newOffice, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            value={newOffice.location}
            onChange={(e) => setNewOffice({ ...newOffice, location: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Check-in Methods</InputLabel>
            <Select
              multiple
              value={newOffice.checkInMethods}
              onChange={(e) => setNewOffice({ ...newOffice, checkInMethods: e.target.value as ('MANUAL' | 'RFID')[] })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem value="RFID">RFID</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Expected Check-in Time"
            type="time"
            fullWidth
            value={newOffice.expectedCheckIn}
            onChange={(e) => setNewOffice({ ...newOffice, expectedCheckIn: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Expected Check-out Time"
            type="time"
            fullWidth
            value={newOffice.expectedCheckOut}
            onChange={(e) => setNewOffice({ ...newOffice, expectedCheckOut: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfficeDialog(false)}>Cancel</Button>
          <Button onClick={() => createOfficeMutation.mutate(newOffice)}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Office Dialog */}
      <Dialog open={editOfficeDialog} onClose={() => setEditOfficeDialog(false)}>
        <DialogTitle>Edit Office</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={selectedOffice?.name || ''}
            onChange={(e) => setSelectedOffice({ ...selectedOffice, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            value={selectedOffice?.location || ''}
            onChange={(e) => setSelectedOffice({ ...selectedOffice, location: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Check-in Methods</InputLabel>
            <Select
              multiple
              value={selectedOffice?.checkInMethods || []}
              onChange={(e) => setSelectedOffice({ ...selectedOffice, checkInMethods: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: string) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem value="RFID">RFID</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Expected Check-in Time"
            type="time"
            fullWidth
            value={selectedOffice?.expectedCheckIn || ''}
            onChange={(e) => setSelectedOffice({ ...selectedOffice, expectedCheckIn: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Expected Check-out Time"
            type="time"
            fullWidth
            value={selectedOffice?.expectedCheckOut || ''}
            onChange={(e) => setSelectedOffice({ ...selectedOffice, expectedCheckOut: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOfficeDialog(false)}>Cancel</Button>
          <Button onClick={() => updateOfficeMutation.mutate(selectedOffice)}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 