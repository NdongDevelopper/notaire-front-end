import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Download, Eye, EyeOff, Smartphone, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { MAX_FAILED_ATTEMPTS_WARNING } from '../store/auth.store';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function LoginForm() {
  const { submit, isSubmitting, formError, failedLoginAttempts } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(() => {
    try {
      return sessionStorage.getItem('easy-notaire-install-card-dismissed') !== 'true';
    } catch {
      return true;
    }
  });
  const [installMessage, setInstallMessage] = useState('');

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallCard(false);
      setInstallMessage('Easy Notaire est installé sur cet appareil.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setInstallMessage(
        'Pour installer Easy Notaire, ouvrez le menu de votre navigateur puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
      );
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallCard(false);
      setInstallMessage('Installation lancée.');
    }
    setInstallPrompt(null);
  };

  const handleInstallLater = () => {
    setShowInstallCard(false);
    try {
      sessionStorage.setItem('easy-notaire-install-card-dismissed', 'true');
    } catch {
      // La carte est simplement masquée pour cette session si le stockage est indisponible.
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const showLockoutWarning = failedLoginAttempts >= MAX_FAILED_ATTEMPTS_WARNING;

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <form onSubmit={handleSubmit(submit)} className="max-w-sm space-y-5" noValidate>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-500">
          Accédez à l'espace de gestion de l'étude.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {showLockoutWarning && !formError && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700"
        >
          Plusieurs tentatives ont échoué. Vérifiez vos identifiants ou contactez un associé.
        </div>
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="prenom.nom@notaire.sn"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-2.5 top-[30px] p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Se connecter
      </Button>

      <p className="text-center text-xs text-slate-400">
        Mot de passe oublié ? Contactez un associé de l'étude pour une réinitialisation.
      </p>

      {showInstallCard && (
        <section
          aria-labelledby="install-easy-notaire-title"
          className="relative rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm"
        >
          <button
            type="button"
            onClick={handleInstallLater}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
            aria-label="Fermer la proposition d’installation"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-3 pr-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Smartphone size={21} />
            </div>
            <div className="min-w-0">
              <h2 id="install-easy-notaire-title" className="text-sm font-semibold text-slate-900">
                Installer Easy Notaire
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Installez l'application pour un accès rapide et une expérience optimale, même hors ligne.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="w-full" onClick={handleInstall}>
              <span className="inline-flex items-center justify-center gap-2">
                <Download size={16} /> Installer maintenant
              </span>
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={handleInstallLater}>
              Plus tard
            </Button>
          </div>
          {installMessage && (
            <p role="status" className="mt-3 text-xs leading-5 text-slate-600">
              {installMessage}
            </p>
          )}
        </section>
      )}
    </form>
  );
}
