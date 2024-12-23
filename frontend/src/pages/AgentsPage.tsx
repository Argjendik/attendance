import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import api from '../services/api';
import { Agent, Office, AgentResponse, OfficeResponse } from '../types';

interface NewAgentData {
  name: string;
  rfidCode: string;
  officeId: number;
}

const AgentsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [newAgent, setNewAgent] = useState<NewAgentData>({
    name: '',
    rfidCode: '',
    officeId: 0,
  });

  const queryClient = useQueryClient();

  const { data: agentsResponse, isLoading: isLoadingAgents, error: agentsError } = useQuery<AgentResponse>({
    queryKey: ['agents'],
    queryFn: async (): Promise<AgentResponse> => {
      const { data } = await api.get<AgentResponse>('/agents');
      return data;
    }
  });

  const { data: officesResponse, isLoading: isLoadingOffices, error: officesError } = useQuery<OfficeResponse>({
    queryKey: ['offices'],
    queryFn: async (): Promise<OfficeResponse> => {
      const { data } = await api.get<OfficeResponse>('/offices');
      return data;
    }
  });

  const createAgentMutation = useMutation<Agent, Error, NewAgentData>({
    mutationFn: async (agentData): Promise<Agent> => {
      const { data } = await api.post<{ agent: Agent }>('/agents', agentData);
      return data.agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setOpen(false);
      setNewAgent({ name: '', rfidCode: '', officeId: 0 });
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create agent');
    },
  });

  const updateAgentMutation = useMutation<Agent, Error, { id: number; data: NewAgentData }>({
    mutationFn: async ({ id, data }): Promise<Agent> => {
      const { data: response } = await api.put<{ agent: Agent }>(`/agents/${id}`, data);
      return response.agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setOpen(false);
      setSelectedAgent(null);
      setNewAgent({ name: '', rfidCode: '', officeId: 0 });
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update agent');
    },
  });

  const deleteAgentMutation = useMutation<void, Error, number>({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to delete agent');
    },
  });

  if (isLoadingAgents || isLoadingOffices) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (agentsError || officesError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {(agentsError as Error)?.message || (officesError as Error)?.message || 'Failed to load data'}
      </Alert>
    );
  }

  const agents = agentsResponse?.data?.agents || [];
  const offices = officesResponse?.data?.offices || [];

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setNewAgent({
      name: agent.name,
      rfidCode: agent.rfidCode || '',
      officeId: agent.office.id,
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteAgentMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (!newAgent.name || !newAgent.officeId) {
      setError('Name and Office are required');
      return;
    }
    if (selectedAgent) {
      updateAgentMutation.mutate({ id: selectedAgent.id, data: newAgent });
    } else {
      createAgentMutation.mutate(newAgent);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAgent(null);
    setNewAgent({ name: '', rfidCode: '', officeId: 0 });
    setError('');
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Agents
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        Add New Agent
      </Button>

      {agents.length === 0 ? (
        <Alert severity="info">No agents found. Add your first agent using the button above.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>RFID Code</TableCell>
                <TableCell>Office</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.rfidCode || 'Not Set'}</TableCell>
                  <TableCell>{agent.office.name}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => handleEdit(agent)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(agent.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{selectedAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            required
            value={newAgent.name}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="RFID Code"
            fullWidth
            value={newAgent.rfidCode}
            onChange={(e) => setNewAgent({ ...newAgent, rfidCode: e.target.value })}
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Office</InputLabel>
            <Select
              value={newAgent.officeId || ''}
              onChange={(e) => setNewAgent({ ...newAgent, officeId: Number(e.target.value) })}
            >
              {offices.map((office) => (
                <MenuItem key={office.id} value={office.id}>
                  {office.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={createAgentMutation.isLoading || updateAgentMutation.isLoading}
          >
            {createAgentMutation.isLoading || updateAgentMutation.isLoading
              ? (selectedAgent ? 'Updating...' : 'Adding...')
              : (selectedAgent ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AgentsPage; 