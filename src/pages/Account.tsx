import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../auth/types';
import { PASSWORD_MIN_LENGTH, hasErrors, translateAuthError, validateSignIn, validateSignUp, type FieldErrors, type SignUpInput } from '../auth/validation';
import { DemoNotice, FormError, PrimaryButton, TextField } from '../components/Form';
import { BackIcon } from '../components/Icons';
import { Logo } from '../components/Layout';
import { CONCEPT_LABEL, DISCLAIMER } from '../lib/format';

function messageOf(err: unknown): string {
  return err instanceof AuthError ? err.message : translateAuthError(err instanceof Error ? err.message : null);
}

/** Onboarding stap 1: account aanmaken (naam, e-mail, wachtwoord). */
export function SignUpForm({ onDone }: { onDone: () => void }) {
  const { service, applyUser } = useAuth();
  const [form, setForm] = useState<SignUpInput>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<SignUpInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const set = (key: keyof SignUpInput) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateSignUp(form);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setLoading(true);
    try {
      const result = await service.signUp(form);
      if (result.status === 'confirm_email') setConfirmEmail(result.email);
      else {
        applyUser(result.user);
        onDone();
      }
    } catch (err) {
      setFormError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="rounded-lg bg-xxl-white p-5" role="status">
        <h2 className="text-lg font-black uppercase">Check je mail</h2>
        <p className="mt-2 text-sm">
          We hebben een bevestigingslink gestuurd naar <strong>{confirmEmail}</strong>. Klik op de link en je gaat vanzelf verder met de vragen.
        </p>
        <p className="mt-2 text-xs text-xxl-black/60">Niets ontvangen? Kijk ook in je spammap.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {service.mode === 'demo' && <DemoNotice />}
      <TextField label="Naam" value={form.name} onChange={set('name')} error={errors.name} autoComplete="given-name" maxLength={60} />
      <TextField label="E-mail" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" inputMode="email" />
      <TextField
        label="Wachtwoord"
        type="password"
        value={form.password}
        onChange={set('password')}
        error={errors.password}
        hint={`Minstens ${PASSWORD_MIN_LENGTH} tekens.`}
        autoComplete="new-password"
      />
      <FormError message={formError} />
      <PrimaryButton type="submit" loading={loading}>
        Account aanmaken
      </PrimaryButton>
      <p className="text-xs leading-relaxed text-xxl-black/60">
        Door een account aan te maken ga je akkoord met de{' '}
        <Link to="/privacy" className="font-bold underline">
          privacyverklaring
        </Link>
        . We vragen alleen wat nodig is voor je advies.
      </p>
      <p className="text-center text-sm">
        Heb je al een account?{' '}
        <Link to="/inloggen" className="font-bold text-xxl-red underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function SignIn() {
  const { service, user, applyUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/home';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateSignIn(form);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setLoading(true);
    try {
      applyUser(await service.signIn(form));
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-xxl-grey px-4 pt-4 pb-8">
      <Link to="/" className="flex min-h-11 items-center gap-1 self-start text-sm font-bold uppercase" aria-label="Terug naar welkom">
        <BackIcon size={18} /> Terug
      </Link>
      <div className="mt-6">
        <Logo className="text-2xl" />
        <h1 className="mt-6 text-2xl font-black uppercase">Inloggen</h1>
        <p className="mt-1 text-sm text-xxl-black/70">Welkom terug. Log in om je advies te zien.</p>
      </div>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {service.mode === 'demo' && <DemoNotice />}
        <TextField
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          error={errors.email}
          autoComplete="email"
          inputMode="email"
        />
        <TextField
          label="Wachtwoord"
          type="password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          error={errors.password}
          autoComplete="current-password"
        />
        <FormError message={formError} />
        <PrimaryButton type="submit" loading={loading}>
          Inloggen
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm">
        Nog geen account?{' '}
        <Link to="/onboarding/1" className="font-bold text-xxl-red underline underline-offset-4">
          Start hier
        </Link>
      </p>
    </div>
  );
}

/** Accountblok in het Profiel-tabblad: gegevens, uitloggen en account verwijderen (AVG). */
export function AccountSection() {
  const { service, user, applyUser } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function logout() {
    setBusy(true);
    await service.signOut();
    applyUser(null);
    navigate('/', { replace: true });
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await service.deleteAccount();
      applyUser(null);
      navigate('/', { replace: true, state: { deleted: true } });
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="account-title">
      <h2 id="account-title" className="text-base font-extrabold uppercase">
        Account & privacy
      </h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-semibold">Naam</dt>
        <dd className="break-words">{user.name}</dd>
        <dt className="font-semibold">E-mail</dt>
        <dd className="break-all">{user.email}</dd>
      </dl>
      {service.mode === 'demo' && <p className="mt-3 text-xs text-xxl-black/60">Demo-account: staat alleen in deze browser.</p>}

      <div className="mt-4 space-y-2">
        <button type="button" onClick={logout} disabled={busy} className="min-h-12 w-full rounded-md border-2 border-xxl-black text-sm font-extrabold uppercase">
          Uitloggen
        </button>
        <Link to="/privacy" className="flex min-h-11 items-center justify-center text-sm font-bold underline underline-offset-4">
          Privacyverklaring
        </Link>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="min-h-11 w-full text-sm font-bold text-xxl-red underline underline-offset-4">
            Account verwijderen
          </button>
        ) : (
          <div className="rounded-md border-2 border-xxl-red p-4" role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-desc">
            <p id="delete-title" className="font-extrabold">
              Account echt verwijderen?
            </p>
            <p id="delete-desc" className="mt-1 text-sm text-xxl-black/80">
              Je account en al je gegevens worden direct en definitief verwijderd. Dit kun je niet ongedaan maken.
            </p>
            <FormError message={error} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="min-h-12 rounded-md border-2 border-xxl-black text-sm font-extrabold uppercase">
                Annuleren
              </button>
              <button type="button" onClick={remove} disabled={busy} className="min-h-12 rounded-md bg-xxl-red text-sm font-extrabold text-xxl-white uppercase disabled:opacity-60">
                {busy ? 'Bezig…' : 'Verwijderen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-xxl-white px-4 pt-4 pb-10">
      <button type="button" onClick={() => navigate(-1)} className="flex min-h-11 items-center gap-1 text-sm font-bold uppercase">
        <BackIcon size={18} /> Terug
      </button>
      <h1 className="mt-4 text-2xl font-black uppercase">Privacyverklaring</h1>
      <p className="mt-1 text-xs font-bold text-xxl-black/60 uppercase">{CONCEPT_LABEL}</p>
      <div className="mt-6 space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-extrabold uppercase">Welke gegevens vragen we?</h2>
          <p className="mt-1">
            Alleen wat nodig is voor je advies: je naam, je e-mailadres, je antwoorden op de vragen over sport, doel en smaak, en of je 18 jaar of ouder bent. Bestellingen in deze demo zijn nep.
          </p>
        </section>
        <section>
          <h2 className="font-extrabold uppercase">Je wachtwoord</h2>
          <p className="mt-1">
            Wij zien en bewaren je wachtwoord nooit. Dat regelt onze inlogdienst (Supabase Auth), die het alleen versleuteld opslaat.
          </p>
        </section>
        <section>
          <h2 className="font-extrabold uppercase">Waarvoor gebruiken we het?</h2>
          <p className="mt-1">Alleen om je productadvies te berekenen en je bestellingen te tonen. We verkopen en delen je gegevens niet.</p>
        </section>
        <section>
          <h2 className="font-extrabold uppercase">Verwijderen</h2>
          <p className="mt-1">
            Je kunt je account en al je gegevens zelf verwijderen via Profiel &gt; Account & privacy &gt; Account verwijderen. Dat gebeurt direct.
          </p>
        </section>
        <section>
          <h2 className="font-extrabold uppercase">Over deze app</h2>
          <p className="mt-1">
            XXL Groeimaat is een concept en geen officiële app van XXL Nutrition. De app beveelt alleen producten van XXL Nutrition aan en is geen onafhankelijke vergelijking.
          </p>
          <p className="mt-2 text-xxl-black/70">{DISCLAIMER}</p>
        </section>
      </div>
    </div>
  );
}
