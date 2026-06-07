import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Employers } from './pages/Employers';
import { JobPosts } from './pages/JobPosts';
import { ServicePackages } from './pages/ServicePackages';
import { Industries } from './pages/Industries';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Reviews } from './pages/Reviews';
import { Notifications } from './pages/Notifications';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="employers" element={<Employers />} />
              <Route path="job-posts" element={<JobPosts />} />
              <Route path="service-packages" element={<ServicePackages />} />
              <Route path="industries" element={<Industries />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
