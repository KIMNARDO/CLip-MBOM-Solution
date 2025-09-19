import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LicenseManager } from 'ag-grid-enterprise';
import Login from './components/auth/Login';
import CompleteMBOMDashboard from './components/dashboard/CompleteMBOMDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BOMDataProvider } from './contexts/BOMDataContext';
import './css/vscode-dark.css';
import './css/output.css';
import './css/globals.css';

// ag-Grid Enterprise 라이센스 설정
// TODO: 실제 라이센스 키로 교체 필요
LicenseManager.setLicenseKey(
  'YOUR_LICENSE_KEY_HERE'
);

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BOMDataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CompleteMBOMDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </BOMDataProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;