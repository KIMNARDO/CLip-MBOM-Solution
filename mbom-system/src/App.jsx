import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// AG-Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Login from './components/auth/Login';
// 전체 레이아웃 대시보드와 React 그리드 통합
import CompleteMBOMDashboard from './components/dashboard/CompleteMBOMDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BOMDataProvider } from './contexts/BOMDataContext';
import { BOMProvider } from './contexts/BOMContext';
import './css/vscode-dark.css';
import './css/output.css';
import './css/globals.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BOMDataProvider>
            <BOMProvider>
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
            </BOMProvider>
          </BOMDataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;