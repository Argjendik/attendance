import React, { ReactNode } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const getNavButtons = (): ReactNode[] => {
    const buttons: ReactNode[] = [];

    if (userRole === 'ADMIN') {
      buttons.push(
        <Button key="admin" color="inherit" onClick={() => navigate('/admin')}>
          Admin Dashboard
        </Button>
      );
    }

    if (userRole === 'HR') {
      buttons.push(
        <Button key="hr" color="inherit" onClick={() => navigate('/hr')}>
          HR Dashboard
        </Button>
      );
    }

    if (['ADMIN', 'HR'].includes(userRole || '')) {
      buttons.push(
        <Button key="agents" color="inherit" onClick={() => navigate('/agents')}>
          Agents
        </Button>
      );
    }

    buttons.push(
      <Button key="attendance" color="inherit" onClick={() => navigate('/attendance')}>
        Attendance
      </Button>
    );

    return buttons;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Attendance System
          </Typography>
          {getNavButtons()}
          <IconButton color="inherit" onClick={handleLogout} size="large">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default MainLayout; 