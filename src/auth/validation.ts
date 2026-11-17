// Formuliercontrole en foutmeldingen voor account en inloggen. Pure functies, dus goed te testen.

export const PASSWORD_MIN_LENGTH = 8;

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Vul je e-mailadres in.';
  if (!EMAIL_RE.test(value)) return 'Dit e-mailadres klopt niet. Controleer het nog even.';
  return undefined;
}

export function validateName(name: string): string | undefined {
  const value = name.trim();
  if (!value) return 'Vul je naam in.';
  if (value.length > 60) return 'Je naam mag maximaal 60 tekens zijn.';
  return undefined;
}

export function validateSignUp(input: SignUpInput): FieldErrors<SignUpInput> {
  const errors: FieldErrors<SignUpInput> = {};
  const name = validateName(input.name);
  if (name) errors.name = name;

  const email = validateEmail(input.email);
  if (email) errors.email = email;

  if (!input.password) errors.password = 'Kies een wachtwoord.';
  else if (input.password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Je wachtwoord moet minstens ${PASSWORD_MIN_LENGTH} tekens hebben.`;

  return errors;
}

export function validateSignIn(input: { email: string; password: string }): FieldErrors<{ email: string; password: string }> {
  const errors: FieldErrors<{ email: string; password: string }> = {};
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  if (!input.password) errors.password = 'Vul je wachtwoord in.';
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}

/** Vertaalt (Engelse) foutmeldingen van Supabase naar duidelijke Nederlandse tekst. */
export function translateAuthError(message: string | undefined | null): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mailadres of wachtwoord klopt niet.';
  if (m.includes('email not confirmed')) return 'Bevestig eerst je e-mailadres via de link in je mail.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists'))
    return 'Er bestaat al een account met dit e-mailadres. Log in.';
  if (m.includes('password should be') || m.includes('weak password'))
    return `Kies een sterker wachtwoord (minstens ${PASSWORD_MIN_LENGTH} tekens).`;
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Te veel pogingen achter elkaar. Wacht even en probeer het opnieuw.';
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Geen verbinding. Controleer je internet en probeer het opnieuw.';
  return 'Er ging iets mis. Probeer het opnieuw.';
}
