import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // OAuth redirect — navigate happens after redirect back
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-500 text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute -top-[10%] -left-[5%] w-1/2 h-1/2 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[5%] w-1/2 h-1/2 bg-sky-100/40 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-[440px] bg-white border border-gray-200/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Bienvenido</h1>
            <p className="text-sm text-gray-500">Inicia sesión en Sebas.ai</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Google OAuth button */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg py-2.5 px-4 mb-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span className="text-sm font-medium text-gray-700">
              {busy ? 'Redirigiendo...' : 'Continuar con Google'}
            </span>
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-100 bg-white/80">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-3">
          <span className="font-semibold text-gray-900 text-sm">Sebas.ai</span>
          <span className="text-xs text-gray-400">© 2024 Sebas.ai Inc. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Privacidad</a>
            <a href="#" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10.02H12V14.24H17.92C17.67 15.6 16.92 16.75 15.77 17.52V20.25H19.33C21.41 18.33 22.56 15.54 22.56 12.25Z" fill="#4285F4" />
      <path d="M12 23C14.97 23 17.46 22.02 19.33 20.25L15.77 17.52C14.76 18.2 13.48 18.6 12 18.6C9.13 18.6 6.71 16.66 5.84 14.07H2.18V16.91C3.99 20.5 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.07C5.62 13.41 5.49 12.72 5.49 12C5.49 11.28 5.61 10.59 5.84 9.93V7.09H2.18C1.43 8.58 1 10.24 1 12C1 13.76 1.43 15.42 2.18 16.91L5.84 14.07Z" fill="#FBBC05" />
      <path d="M12 5.4C13.62 5.4 15.06 5.96 16.21 7.05L19.41 3.85C17.45 2.02 14.97 1 12 1C7.7 1 3.99 3.5 2.18 7.09L5.84 9.93C6.71 7.34 9.13 5.4 12 5.4Z" fill="#EA4335" />
    </svg>
  );
}
