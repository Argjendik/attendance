import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTheme } from '@mui/material';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import AgentsPage from './pages/AgentsPage';
import { Role } from './types';

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') as Role | null;

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const theme = createTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={<MainLayout />}>
                <Route index element={
                  <Navigate to="/attendance" replace />
                } />
                
                <Route path="admin" element={
                  <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="hr" element={
                  <ProtectedRoute allowedRoles={[Role.HR]}>
                    <HRDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="attendance" element={
                  <ProtectedRoute allowedRoles={[Role.ADMIN, Role.MANAGER, Role.HR, Role.AGENT]}>
                    <AttendanceHistory />
                  </ProtectedRoute>
                } />
                
                <Route path="agents" element={
                  <ProtectedRoute allowedRoles={[Role.ADMIN, Role.HR]}>
                    <AgentsPage />
                  </ProtectedRoute>
                } />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 