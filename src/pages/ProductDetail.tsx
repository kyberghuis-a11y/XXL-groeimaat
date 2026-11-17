import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackIcon, CheckIcon, TruckIcon } from '../components/Icons';
import { Badge, CaffeineLabel, Rating } from '../components/ProductBits';
import { ProductImage } from '../components/ProductImage';
import { fromPrice, getProductLine, pricePerServing } from '../data/catalog';
import { formatEuro, FLAVOR_FAMILY_LABELS, USP_MESSAGES } from '../lib/format';

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-md border-2 px-3 text-left text-sm font-semibold ${
        active ? 'border-xxl-black bg-xxl-black text-xxl-white' : 'border-xxl-black/15 bg-xxl-white hover:border-xxl-black/40'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-xxl-black/10 py-5">
      <h2 className="mb-2 text-sm font-extrabold tracking-wider uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** key={id}: bij een ander product beginnen smaak- en formaatkeuze opnieuw. */
export function ProductDetail() {
  const { id = '' } = useParams();
  return <ProductDetailView key={id} id={id} />;
}

function ProductDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const product = getProductLine(id);
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(0);

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-black uppercase">Product niet gevonden</p>
        <Link to="/ontdek" className="mt-4 inline-block font-bold text-xxl-red underline">
          Terug naar Ontdek
        </Link>
      </div>
    );
  }

  const flavor = product.flavors[flavorIndex];
  const size = product.sizes[sizeIndex];
  const pps = pricePerServing(size.price_eur, size.servings);
  const namedFlavors = product.flavors.filter((f) => f.name !== null);
  const knownTotal = product.flavor_count_total;

  return (
    <article className="bg-xxl-white">
      <div className="relative">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/ontdek'))}
          className="absolute top-3 left-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-xxl-white shadow"
          aria-label="Terug"
        >
          <BackIcon />
        </button>
        <ProductImage product={product} className="aspect-[4/3] w-full" />
      </div>

      <div className="px-4 pb-6">
        {/* Volgorde zoals op xxlnutrition.com: titel → badge → beoordeling → tagline → In het kort → prijs → keuze → knop */}
        <h1 className="pt-4 text-2xl leading-tight font-black">{product.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge badge={product.badge} />
          <CaffeineLabel product={product} />
        </div>
        <div className="mt-2">
          <Rating product={product} size="md" />
        </div>
        <p className="mt-2 text-base font-semibold text-xxl-black/80">{product.tagline}</p>

        <Section title="In het kort">
          <ul className="space-y-1.5">
            {product.short_bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm">
                <CheckIcon size={18} className="mt-px shrink-0 text-xxl-red" />
                {b}
              </li>
            ))}
          </ul>
        </Section>

        <section className="border-t border-xxl-black/10 py-5" aria-live="polite">
          <p className="text-sm text-xxl-black/60">Vanaf {formatEuro(fromPrice(product))}</p>
          <p className="text-3xl font-black text-xxl-red">{formatEuro(size.price_eur)}</p>
          <p className="text-sm text-xxl-black/70">
            {size.label}
            {size.servings !== null && ` · ${size.servings} porties`}
            {pps !== null ? ` · ${formatEuro(pps)} per portie` : ' · prijs per portie volgt'}
          </p>
          {size.needs_check && <p className="mt-1 text-xs text-xxl-black/50">Prijs is een indicatie en wordt nog gecontroleerd.</p>}
        </section>

        {namedFlavors.length > 0 && (
          <Section title={`Smaak: ${flavor.name ?? ''}`}>
            <div className="grid grid-cols-2 gap-2">
              {product.flavors.map((f, i) => (
                <OptionButton key={f.name ?? i} active={i === flavorIndex} onClick={() => setFlavorIndex(i)}>
                  <span className="block">{f.name}</span>
                  <span className={`block text-[11px] font-normal ${i === flavorIndex ? 'text-xxl-white/70' : 'text-xxl-black/50'}`}>
                    {FLAVOR_FAMILY_LABELS[f.family]}
                  </span>
                </OptionButton>
              ))}
            </div>
            {knownTotal !== null && knownTotal > namedFlavors.length && (
              <p className="mt-2 text-xs text-xxl-black/50">
                XXL heeft {knownTotal} smaken; {namedFlavors.length} staan al in de app.
              </p>
            )}
          </Section>
        )}

        <Section title="Formaat">
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s, i) => (
              <OptionButton key={s.label} active={i === sizeIndex} onClick={() => setSizeIndex(i)}>
                {s.label}
              </OptionButton>
            ))}
          </div>
        </Section>

        <button
          type="button"
          disabled
          className="mt-2 min-h-14 w-full cursor-not-allowed rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase opacity-50"
          aria-describedby="order-later"
        >
          In winkelwagen
        </button>
        <p id="order-later" className="mt-2 text-center text-xs text-xxl-black/60">
          Bestellen komt in een volgende stap.
        </p>

        <Section title="Leverbeloftes">
          <ul className="space-y-1.5">
            {USP_MESSAGES.map((m) => (
              <li key={m} className="flex gap-2 text-sm">
                <TruckIcon size={18} className="shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Beschrijving">
          <p className="text-sm leading-relaxed">{product.beginner_info}</p>
          <p className="mt-2 text-sm leading-relaxed text-xxl-black/80">{product.description}</p>
        </Section>

        <Section title="Wat zit erin?">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-semibold">Eiwit per portie</dt>
            <dd>{product.protein_per_serving !== null ? `${product.protein_per_serving.toLocaleString('nl-NL')} g` : 'Nog niet bekend'}</dd>
            <dt className="font-semibold">Categorie</dt>
            <dd>{product.category}</dd>
          </dl>
        </Section>

        <Section title="Allergenen">
          <p className="text-sm">
            {product.allergens.length > 0 ? `Bevat: ${product.allergens.join(', ')}.` : 'Geen allergenen bekend in onze gegevens.'}
          </p>
          {!product.allergens_complete && (
            <p className="mt-1 text-xs text-xxl-black/60">
              Deze informatie is nog niet volledig gecontroleerd. Check altijd de verpakking of de productpagina van XXL Nutrition.
            </p>
          )}
        </Section>

        {product.needs_check && (
          <Section title="Nog te controleren">
            <ul className="list-disc space-y-1 pl-5 text-xs text-xxl-black/60">
              {product.check_notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Section>
        )}

        <a
          href={product.xxl_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex min-h-12 items-center justify-center rounded-md border-2 border-xxl-black text-sm font-extrabold uppercase"
        >
          Bekijk op xxlnutrition.com
        </a>
      </div>
    </article>
  );
}
