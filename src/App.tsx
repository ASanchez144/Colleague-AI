/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizationDebug from './pages/OrganizationDebug';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import ProtectedRoute from './components/ProtectedRoute';
import RequireOrganization from './components/RequireOrganization';

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Fase 4: /dashboardroot guarded by Supabase auth + org context */}
              <Route
                path="/dashboardroot"
                element={
                  <ProtectedRoute>
                    <RequireOrganization>
                      <Dashboard />
                    </RequireOrganization>
                  </ProtectedRoute>
                }
              />

              {/* /app → same dashboard (OAuth redirects here) */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <RequireOrganization>
                      <Dashboard />
                    </RequireOrganization>
                  </ProtectedRoute>
                }
              />

              {/* DEV ONLY — Fase 3 debug page, remove before production */}
              <Route
                path="/org-debug"
                element={<ProtectedRoute><OrganizationDebug /></ProtectedRoute>}
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
