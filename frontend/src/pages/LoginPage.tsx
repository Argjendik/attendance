import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoginResponse, Role } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
      const { access_token, user } = data;
      
      // Clear any existing auth data
      localStorage.clear();
      
      // Set new auth data
      localStorage.setItem('token', access_token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userEmail', user.email);
      
      // Store office assignments
      if (user.offices && user.offices.length > 0) {
        localStorage.setItem('userOffices', JSON.stringify(user.offices));
        // For backward compatibility, also store the first office ID
        localStorage.setItem('userOfficeId', user.offices[0].id.toString());
      }
      
      // Redirect based on role
      switch (user.role) {
        case Role.ADMIN:
          navigate('/admin');
          break;
        case Role.HR:
          navigate('/hr');
          break;
        case Role.MANAGER:
          navigate('/hr'); // Managers also use the HR dashboard but see all offices
          break;
        default:
          navigate('/attendance');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to login';
      setError(errorMessage);
      
      // Clear any partial auth data on error
      localStorage.clear();
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 