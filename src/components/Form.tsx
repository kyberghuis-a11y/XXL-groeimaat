import { useId, useState } from 'react';

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

export function TextField({ label, value, onChange, error, hint, type = 'text', ...rest }: FieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-extrabold tracking-wider uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`min-h-12 w-full rounded-md border-2 bg-xxl-white px-3 text-base outline-none focus:border-xxl-black ${
            error ? 'border-xxl-red' : 'border-xxl-black/15'
          } ${isPassword ? 'pr-20' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-1 min-h-10 -translate-y-1/2 px-3 text-xs font-bold uppercase underline"
            aria-label={visible ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
          >
            {visible ? 'Verberg' : 'Toon'}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-xxl-black/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-xxl-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border-2 border-xxl-red bg-xxl-white p-3 text-sm font-semibold text-xxl-red">
      {message}
    </p>
  );
}

export function PrimaryButton({ children, loading, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`flex min-h-14 w-full items-center justify-center rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase disabled:opacity-60 ${rest.className ?? ''}`}
    >
      {loading ? 'Even geduld…' : children}
    </button>
  );
}

/** Melding dat de app in demo-modus draait (geen Supabase-sleutels ingevuld). */
export function DemoNotice() {
  return (
    <p className="rounded-md bg-xxl-black/5 p-3 text-xs leading-relaxed text-xxl-black/70">
      <strong>Demo-modus:</strong> je account staat alleen in deze browser. Je wachtwoord wordt niet opgeslagen en dus ook niet gecontroleerd bij inloggen.
    </p>
  );
}
