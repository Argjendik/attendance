import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Avatar,
  Card,
  CardContent,
  CardActions,
  TextField,
  Alert,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Agent, AgentResponse, UserProfileResponse } from '../types';

const HRDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const userRole = localStorage.getItem('userRole');

  // Get user profile to access assigned offices
  const { data: userProfile } = useQuery<UserProfileResponse>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get<UserProfileResponse>('/users/profile');
      return data;
    },
  });

  // Get agents based on user's role and office assignments
  const { data: agentsResponse, isLoading, error: fetchError } = useQuery<AgentResponse>({
    queryKey: ['agents', selectedOffice],
    queryFn: async () => {
      const params: any = {};
      if (selectedOffice) {
        params.officeId = selectedOffice;
      } else if (userRole === 'HR' && userProfile?.data?.user?.offices) {
        // If HR and no specific office selected, get agents from all assigned offices
        params.officeIds = userProfile.data.user.offices.map(office => office.id);
      }
      const { data } = await api.get<AgentResponse>('/agents', { params });
      return data;
    },
    enabled: !!userProfile && (userRole !== 'HR' || userProfile.data.user.offices.length > 0),
  });

  // Get latest attendance status for all agents
  const { data: statusResponse } = useQuery({
    queryKey: ['attendance-status', selectedOffice],
    queryFn: async () => {
      const { data } = await api.get('/attendance/latest-status');
      return data;
    },
    enabled: !!userProfile,
  });

  const agentStatuses = statusResponse?.data?.statuses || {};

  const checkAttendanceMutation = useMutation({
    mutationFn: async ({ agentId, action }: { agentId: number; action: 'CHECK_IN' | 'CHECK_OUT' }) => {
      const agent = allAgents.find(a => a.id === agentId);
      if (!agent) throw new Error('Agent not found');
      if (!agent.rfidCode) throw new Error('Agent does not have an RFID code assigned');
      
      try {
        const { data } = await api.post('/attendance/check', {
          agentId: agent.id,
          action,
          recordedBy: localStorage.getItem('userEmail'),
          isManualEntry: true,
        });
        return data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to record attendance');
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-status'] });
      setSuccess(`Successfully ${variables.action === 'CHECK_IN' ? 'checked in' : 'checked out'} agent`);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to record attendance');
      setSuccess(null);
    },
  });

  const handleCheckAttendance = (agentId: number, action: 'CHECK_IN' | 'CHECK_OUT') => {
    setError(null);
    setSuccess(null);
    checkAttendanceMutation.mutate({ agentId, action });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {(fetchError as Error)?.message || 'Failed to load data'}
      </Alert>
    );
  }

  const allAgents = agentsResponse?.data?.agents || [];
  const userOffices = userProfile?.data?.user?.offices || [];

  // Filter agents based on search term
  const filteredAgents = allAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If HR has no offices assigned
  if (userRole === 'HR' && userOffices.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manual Check-in/out
        </Typography>
        <Alert severity="warning">
          You don't have any offices assigned. Please contact an administrator.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manual Check-in/out
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Agents"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        {userRole === 'HR' && userOffices.length > 0 && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Office</InputLabel>
              <Select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                label="Filter by Office"
              >
                <MenuItem value="">All Assigned Offices</MenuItem>
                {userOffices.map((office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      {filteredAgents.length === 0 ? (
        <Alert severity="info">No agents found matching your criteria.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAgents.map((agent) => {
            const isCheckedIn = agentStatuses[agent.id] === 'CHECKED_IN';
            
            return (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>{agent.name[0]}</Avatar>
                      <Box>
                        <Typography variant="h6">{agent.name}</Typography>
                        <Typography color="textSecondary">
                          Office: {agent.office.name}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      RFID: {agent.rfidCode || 'Not Set'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Status: {agent.status}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: isCheckedIn ? 'success.main' : 'error.main',
                      fontWeight: 'bold',
                      mt: 1
                    }}>
                      {isCheckedIn ? 'Currently Checked In' : 'Currently Checked Out'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => handleCheckAttendance(agent.id, 'CHECK_IN')}
                      disabled={checkAttendanceMutation.isLoading || !agent.rfidCode || isCheckedIn}
                    >
                      Check In
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      onClick={() => handleCheckAttendance(agent.id, 'CHECK_OUT')}
                      disabled={checkAttendanceMutation.isLoading || !agent.rfidCode || !isCheckedIn}
                    >
                      Check Out
                    </Button>
                  </CardActions>
                  {!agent.rfidCode && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      RFID code not set
                    </Alert>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default HRDashboard; 