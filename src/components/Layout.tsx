import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { USP_MESSAGES } from '../lib/format';
import { BoxIcon, CartIcon, CompassIcon, HomeIcon, SearchIcon, UserIcon } from './Icons';

/** Smalle kolom in het midden: mobile-first, op desktop max. 480 px breed. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-xxl-grey shadow-sm">{children}</div>;
}

export function UspBar() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % USP_MESSAGES.length), 4000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="bg-xxl-black px-4 py-1.5 text-center text-xs font-semibold text-xxl-white" aria-live="polite">
      <span key={index} className="usp-fade inline-block">
        {USP_MESSAGES[index]}
      </span>
    </div>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight uppercase ${className}`}>
      <span className="bg-xxl-red px-1.5 text-xxl-white">XXL</span> <span>Groeimaat</span>
    </span>
  );
}

export function Header() {
  const navigate = useNavigate();
  const cartCount = 0; // Winkelwagen komt in bouwstap 7.
  return (
    <header className="flex items-center justify-between border-b border-xxl-black/10 bg-xxl-white px-4 py-3">
      <NavLink to="/home" aria-label="Naar Home" className="text-lg text-xxl-black">
        <Logo />
      </NavLink>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate('/ontdek?zoek=1')}
          className="grid h-11 w-11 place-items-center rounded-full text-xxl-black hover:bg-xxl-grey"
          aria-label="Zoeken"
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          className="relative grid h-11 w-11 place-items-center rounded-full text-xxl-black hover:bg-xxl-grey"
          aria-label={`Winkelwagen, ${cartCount} producten`}
          title="Bestellen komt in een volgende stap"
        >
          <CartIcon />
          <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-xxl-red px-1 text-[10px] font-bold text-xxl-white">
            {cartCount}
          </span>
        </button>
      </div>
    </header>
  );
}

const TABS = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/ontdek', label: 'Ontdek', Icon: CompassIcon },
  { to: '/bestellingen', label: 'Bestellingen', Icon: BoxIcon },
  { to: '/profiel', label: 'Profiel', Icon: UserIcon },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] bg-xxl-black pb-[env(safe-area-inset-bottom)]"
      aria-label="Hoofdnavigatie"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold tracking-wide uppercase ${
                  isActive ? 'text-xxl-red' : 'text-xxl-white/70 hover:text-xxl-white'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Layout voor de vier tabbladen: USP-balk + header bovenin, navigatie onderin. */
export function TabLayout() {
  return (
    <div className="flex min-h-dvh flex-col pb-20">
      <div className="sticky top-0 z-20">
        <UspBar />
        <Header />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

/** Kaart die laat zien dat een onderdeel nog gebouwd wordt. */
export function ComingSoon({ title, step, children }: { title: string; step: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-lg border-2 border-dashed border-xxl-black/15 bg-xxl-white p-5">
      <h2 className="text-base font-extrabold uppercase">{title}</h2>
      <p className="mt-1 text-sm text-xxl-black/70">Komt in een volgende stap ({step}).</p>
      {children}
    </section>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl leading-tight font-black uppercase">{children}</h1>;
}
