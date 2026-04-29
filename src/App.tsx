/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizationDebug from './pages/OrganizationDebug';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  // Firebase auth state — kept for /dashboardroot legacy route (Fase 4 will migrate to Supabase)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setFirebaseLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (firebaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Cargando...
      </div>
    );
  }

  return (
    <AuthProvider>
      <OrganizationProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* DEV ONLY — Fase 3 debug page, remove before production */}
              <Route
                path="/org-debug"
                element={<ProtectedRoute><OrganizationDebug /></ProtectedRoute>}
              />
              {/* TODO Fase 4: replace Firebase guard with ProtectedRoute + migrate Dashboard to Supabase */}
              <Route
                path="/dashboardroot"
                element={
                  firebaseUser && firebaseUser.email === 'arturoeldeteruel@gmail.com'
                    ? <Dashboard user={firebaseUser} />
                    : <Navigate to="/" />
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
