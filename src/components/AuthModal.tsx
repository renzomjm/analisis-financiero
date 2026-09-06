import { useState } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  Lock, 
  BarChart3, 
  Info,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess();
      } else {
        // User closed or cancelled popup window
        setError('El inicio de sesión fue cancelado o la ventana se cerró antes de finalizar.');
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente de Google. Por favor autoriza las ventanas emergentes o abre la app en una nueva pestaña.');
      } else if (errorObj?.code === 'auth/network-request-failed') {
        setError('Problema de conexión al contactar el servidor de autenticación de Google. Verifica tu conexión e intenta nuevamente.');
      } else {
        setError(errorObj?.message || 'Ocurrió un error al intentar iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* Dismiss button */}
        <button
          type="button"
          onClick={onSuccess}
          className="absolute top-4 right-4 p-1.5 text-[#71717a] hover:text-white rounded-lg hover:bg-[#27272a] transition-colors cursor-pointer"
          title="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Banner Accent */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 w-full" />

        <div className="p-6 sm:p-7 text-center">
          
          {/* Brand Icon */}
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b] mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Acceso a Cartera ARG-INTEL
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Inicia sesión con tu cuenta de Google para sincronizar y guardar de forma segura tus tenencias y operaciones en la base de datos de Firebase.
          </p>

          {/* Benefits Grid */}
          <div className="my-5 p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl text-left space-y-2 text-xs">
            <div className="flex items-start gap-2.5 text-[#d4d4d8]">
              <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">Persistencia en Firestore:</strong> Tus compras, ventas y precios promedio quedan salvados en la nube.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-[#d4d4d8]">
              <Lock className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">Seguridad por usuario:</strong> Solo tú tienes acceso a los activos registrados con tu cuenta de Google.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-[#d4d4d8]">
              <BarChart3 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">Sincronización en vivo:</strong> Valuaciones en ARS y USD MEP al instante en todos tus dispositivos.
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200 text-left">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-zinc-100 text-[#09090b] font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                <span>Conectando con Google...</span>
              </>
            ) : (
              <>
                {/* Official Google SVG "G" Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Continuar con Google</span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Secondary Action: explore locally */}
          <button
            type="button"
            onClick={onSuccess}
            className="mt-3 w-full py-2 text-xs text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
          >
            Continuar explorando en modo local
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#71717a]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autenticación oficial OAuth 2.0 gestionada por Google Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
