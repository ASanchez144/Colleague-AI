import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // OAuth redirect — navigate happens after redirect back
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse con Google');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden font-sans antialiased">
      {/* Ambient background blobs */}
      <div className="absolute -top-[20%] -left-[10%] w-1/2 h-1/2 rounded-full bg-blue-100/30 blur-[100px] pointer-events-none" />
      <div className="absolute top-[60%] -right-[10%] w-2/5 h-2/5 rounded-full bg-sky-100/30 blur-[100px] pointer-events-none" />

      <main className="w-full max-w-md bg-white rounded-xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Sebas.ai</h1>
          <p className="text-sm text-gray-500">Crea tu cuenta para empezar.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign Up */}
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-6"
        >
          <GoogleIcon />
          {busy ? 'Redirigiendo...' : 'Registrarse con Google'}
        </button>

        {/* TODO Fase 3: email/password registration + org creation flow */}

        {/* Links */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Iniciar sesión
            </Link>
          </p>
          <p className="text-xs text-gray-400 leading-tight px-4">
            Al crear una cuenta aceptas nuestros{' '}
            <a href="#" className="underline hover:text-gray-500">Términos de Servicio</a>{' '}
            y{' '}
            <a href="#" className="underline hover:text-gray-500">Política de Privacidad</a>.
          </p>
        </div>
      </main>
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
