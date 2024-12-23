import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Button,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-toastify';

const ManualCheckInOut: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const queryClient = useQueryClient();

  // Get current user profile to check role and managed offices
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
  });

  // Get all offices
  const { data: officesResponse } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const { data } = await api.get('/offices');
      return data;
    },
    enabled: !!userProfile && userProfile.user.role !== 'HR',
  });

  // Get agents based on user's role and office assignments
  const { data: agentsResponse, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents', selectedOffice],
    queryFn: async () => {
      console.log('Fetching agents with params:', {
        officeId: selectedOffice || undefined,
      });

      const { data } = await api.get('/agents', {
        params: {
          officeId: selectedOffice || undefined,
        },
      });
      console.log('Agents response:', data);
      return data;
    },
    // Enable the query as soon as we have the user profile
    enabled: !!userProfile,
  });

  // Get the list of offices the user has access to
  const availableOffices = useMemo(() => {
    if (!userProfile?.user) return [];
    
    // For HR users, get their assigned offices from the profile
    if (userProfile.user.role === 'HR') {
      return userProfile.user.offices || [];
    }
    
    // For other roles, return all offices
    return officesResponse?.offices || [];
  }, [userProfile?.user, officesResponse?.offices]);

  // Filter agents based on user's role and selected office
  const availableAgents = useMemo(() => {
    if (!userProfile?.user) return [];
    
    const agents = agentsResponse?.agents || [];
    console.log('Available agents:', agents);
    
    // If HR, only show agents from assigned offices
    if (userProfile.user.role === 'HR') {
      if (selectedOffice) {
        // If an office is selected, only show agents from that office
        return agents.filter(agent => agent.officeId === parseInt(selectedOffice));
      } else {
        // If no office is selected, show agents from all assigned offices
        const assignedOfficeIds = new Set(userProfile.user.offices?.map(office => office.id) || []);
        return agents.filter(agent => assignedOfficeIds.has(agent.officeId));
      }
    }
    
    // For other roles, show all agents or filter by selected office
    if (selectedOffice) {
      return agents.filter(agent => agent.officeId === parseInt(selectedOffice));
    }
    return agents;
  }, [userProfile?.user, agentsResponse?.agents, selectedOffice]);

  // For HR users with only one office, automatically select it
  React.useEffect(() => {
    if (userProfile?.user?.role === 'HR' && userProfile.user.offices?.length === 1) {
      setSelectedOffice(userProfile.user.offices[0].id.toString());
    }
  }, [userProfile?.user]);

  // Filter agents based on search term
  const filteredAgents = useMemo(() => {
    let filtered = availableAgents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.rfidCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [availableAgents, searchTerm]);

  const checkInMutation = useMutation({
    mutationFn: async ({ agent, action }: { agent: any; action: 'CHECK_IN' | 'CHECK_OUT' }) => {
      const response = await api.post('/attendance/check', {
        agentId: agent.id,
        action,
        recordedBy: userProfile?.user?.email,
        isManualEntry: true,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both attendance and agents queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Attendance recorded successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to record attendance';
      toast.error(errorMessage);
    },
  });

  const handleCheckInOut = async (agent: any, action: 'CHECK_IN' | 'CHECK_OUT') => {
    checkInMutation.mutate({ agent, action });
  };

  // If user is HR and has no offices assigned, show message
  if (userProfile?.user?.role === 'HR' && (!userProfile.user.offices || userProfile.user.offices.length === 0)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manual Check-in/out
        </Typography>
        <Typography color="error">
          You don't have any offices assigned. Please contact an administrator.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manual Check-in/out
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Agents"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        {availableOffices.length > 1 && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Office</InputLabel>
              <Select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
              >
                <MenuItem value="">All Offices</MenuItem>
                {availableOffices.map((office: any) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      {isLoadingAgents ? (
        <Typography align="center">Loading agents...</Typography>
      ) : filteredAgents.length > 0 ? (
        <Grid container spacing={3}>
          {filteredAgents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} key={agent.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {agent.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{agent.name}</Typography>
                      <Typography color="textSecondary">
                        Office: {agent.office.name}
                      </Typography>
                      <Typography variant="body2">
                        RFID: {agent.rfidCode || 'Not Set'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => handleCheckInOut(agent, 'CHECK_IN')}
                    >
                      CHECK IN
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      onClick={() => handleCheckInOut(agent, 'CHECK_OUT')}
                    >
                      CHECK OUT
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography align="center" color="textSecondary">
          No agents found{searchTerm ? ' matching your search' : ' in the selected office'}
        </Typography>
      )}
    </Box>
  );
};

export default ManualCheckInOut; 