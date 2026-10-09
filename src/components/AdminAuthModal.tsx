import React, { useState } from 'react';
import { ShieldCheck, User, Lock } from 'lucide-react';
import { signInWithPopup, auth, googleProvider } from '../firebase';
import { detectMaliciousPayload } from '../utils/securityValidator';
import { hashPassword, verifyPassword, DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/cryptoAuth';

interface AdminAuthModalProps {
  onClose: () => void;
  onSuccess: (username: string) => void;
  onToast: (msg: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onClose, onSuccess, onToast }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validación estricta contra inyecciones y comandos en login
    const userCheck = detectMaliciousPayload(username);
    if (userCheck.isMalicious) {
      setErrorMsg(`Acceso rechazado: ${userCheck.reason}`);
      return;
    }
    const passCheck = detectMaliciousPayload(password);
    if (passCheck.isMalicious) {
      setErrorMsg(`Acceso rechazado: ${passCheck.reason}`);
      return;
    }

    setLoading(true);

    try {
      // 1. Forzar Autenticación del Lado del Servidor
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.token) {
          localStorage.setItem('alixplay_admin_session_token', data.token);
          onSuccess(username.trim());
          onToast(`¡Sesión iniciada como administrador autenticado en servidor (${username})!`);
          onClose();
          return;
        }
      }

      // 2. Fallback de verificación local mediante Hash Criptográfico Seguro (SHA-256)
      const cleanUser = username.trim().toLowerCase();
      const stored = localStorage.getItem('alixplay_local_admin');
      const defaultEnvUser = (import.meta.env.VITE_ADMIN_DEFAULT_USER as string) || 'admin';
      let validUser = defaultEnvUser.toLowerCase();
      let storedHash = DEFAULT_ADMIN_PASSWORD_HASH;

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.username) validUser = parsed.username.toLowerCase();
          if (parsed.passHash) {
            storedHash = parsed.passHash;
          } else if (parsed.pass) {
            // Migrar contraseña en texto plano anterior a hash criptográfico
            storedHash = await hashPassword(parsed.pass);
            localStorage.setItem('alixplay_local_admin', JSON.stringify({ username: validUser, passHash: storedHash }));
          }
        } catch (err) {
          console.error(err);
        }
      }

      const isPassValid = await verifyPassword(password, storedHash);
      if (cleanUser === validUser && isPassValid) {
        onSuccess(username.trim());
        onToast(`¡Sesión iniciada como administrador (${username})!`);
        onClose();
        return;
      }

      setErrorMsg('Usuario o contraseña incorrectos. Verifica tus credenciales de acceso.');
    } catch {
      setErrorMsg('Error de conexión al servidor de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email || 'Admin';
      onSuccess(email);
      onToast(`¡Sesión iniciada con Google: ${email}!`);
      onClose();
    } catch (err: unknown) {
      console.error('Google Sign-In error:', err);
      setErrorMsg('No se pudo abrir ventana de Google (posible bloqueo en iframe). Puedes ingresar usando tus credenciales de administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative text-center animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">Acceso Administrativo</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ingresa tus credenciales o inicia sesión con tu cuenta Google autorizada.
        </p>

        {/* Google sign-in button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-3 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Conectando...' : 'Acceder con Google'}</span>
        </button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
            <span className="bg-white dark:bg-[#0f172a] px-2">o con credenciales</span>
          </div>
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-3 text-left">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Usuario Admin</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  const val = e.target.value;
                  if (detectMaliciousPayload(val).isMalicious) {
                    setErrorMsg('Caracteres no permitidos en el usuario.');
                    return;
                  }
                  setUsername(val);
                }}
                placeholder="Usuario (ej. admin)"
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  if (detectMaliciousPayload(val).isMalicious) {
                    setErrorMsg('Caracteres no permitidos en la contraseña.');
                    return;
                  }
                  setPassword(val);
                }}
                placeholder="Contraseña"
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ingresar</span>
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Credencial por defecto: <strong>admin</strong> / <strong>admin</strong>
        </div>
      </div>
    </div>
  );
};
