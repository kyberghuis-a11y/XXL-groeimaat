import { Link } from 'react-router-dom';
import type { AdviceGroup, Recommendation } from '../recommend/engine';
import { formatEuro } from '../lib/format';
import { ProductImage } from './ProductImage';
import { productLink } from '../recommend/links';

const CATEGORY_TITLE: Record<AdviceGroup['category'], { title: string; intro: string }> = {
  Eiwitshake: { title: 'Eiwitshake', intro: 'Je basis: een eiwitshake die bij je doel en smaak past.' },
  Creatine: { title: 'Creatine', intro: 'Een kleine schep per dag, door je shake of sap.' },
  Extra: { title: 'Handige extra’s', intro: 'Niet nodig om te beginnen, wel handig bij jouw doel.' },
};

function MatchBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-xxl-black px-2 py-0.5 text-[11px] font-extrabold text-xxl-white" aria-label={`${score}% match`}>
      {score}% match
    </span>
  );
}

function AdviceCard({ r }: { r: Recommendation }) {
  return (
    <li className="overflow-hidden rounded-lg bg-xxl-white shadow-sm ring-1 ring-xxl-black/5">
      <Link to={productLink(r)} className="grid grid-cols-[96px_1fr] gap-3 p-3 hover:bg-xxl-grey/60">
        <ProductImage product={r.line} className="aspect-square w-24 rounded-md" />
        <div className="min-w-0">
          {r.labels.length > 0 && (
            <ul className="mb-1 flex flex-wrap gap-1">
              {r.labels.map((l) => (
                <li key={l} className="bg-xxl-red px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-xxl-white uppercase">
                  {l}
                </li>
              ))}
            </ul>
          )}
          <h3 className="text-base leading-tight font-extrabold">{r.line.name}</h3>
          <p className="text-sm text-xxl-black/70">
            {[r.flavor.name, r.size.label].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-extrabold text-xxl-red">{formatEuro(r.size.price_eur)}</span>
            <span className="text-xs text-xxl-black/70">
              {r.pricePerServing !== null ? `${formatEuro(r.pricePerServing)} per portie` : 'prijs per portie volgt'}
            </span>
          </div>
          <div className="mt-1">
            <MatchBadge score={r.score} />
          </div>
        </div>
      </Link>
      <p className="border-t border-xxl-black/5 px-3 py-2.5 text-sm leading-snug">{r.reason}</p>
    </li>
  );
}

export function AdviceList({ groups }: { groups: AdviceGroup[] }) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.category} aria-labelledby={`advice-${g.category}`}>
          <h2 id={`advice-${g.category}`} className="text-lg font-black uppercase">
            {CATEGORY_TITLE[g.category].title}
          </h2>
          <p className="mb-3 text-sm text-xxl-black/70">{CATEGORY_TITLE[g.category].intro}</p>
          <ul className="space-y-3">
            {g.items.map((r) => (
              <AdviceCard key={r.line.id} r={r} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
