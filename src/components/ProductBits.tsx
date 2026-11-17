import { Link } from 'react-router-dom';
import { bestPricePerServing, fromPrice } from '../data/catalog';
import type { ProductLine } from '../data/types';
import { formatEuro } from '../lib/format';
import { StarIcon } from './Icons';
import { ProductImage } from './ProductImage';
import { flavorCountText } from '../lib/productText';
import { useLineMatch } from '../recommend/useAdvice';

export function Badge({ badge }: { badge: ProductLine['badge'] }) {
  if (!badge) return null;
  return (
    <span className="inline-block bg-xxl-red px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-xxl-white uppercase">
      {badge === 'bestseller' ? 'Bestseller' : 'Nieuw'}
    </span>
  );
}

export function CaffeineLabel({ product }: { product: ProductLine }) {
  if (!product.labels.includes('bevat_cafeine')) return null;
  return (
    <span className="inline-block bg-xxl-black px-2 py-0.5 text-[10px] font-bold tracking-wide text-xxl-white uppercase">
      Bevat cafeïne · alleen 18+
    </span>
  );
}

export function Rating({ product, size = 'sm' }: { product: ProductLine; size?: 'sm' | 'md' }) {
  if (product.rating === null || product.review_count === null) {
    return <p className={`${size === 'sm' ? 'text-[11px]' : 'text-sm'} text-xxl-black/70`}>Nog geen beoordeling</p>;
  }
  const full = Math.round(product.rating);
  return (
    <p className="flex items-center gap-1 text-xs">
      <span className="flex text-xxl-black" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} size={size === 'sm' ? 12 : 16} filled={i <= full} />
        ))}
      </span>
      <span>
        {product.rating.toLocaleString('nl-NL')} ({product.review_count} reviews)
      </span>
    </p>
  );
}

export function ProductCard({ product }: { product: ProductLine }) {
  const pps = bestPricePerServing(product);
  const flavors = flavorCountText(product);
  const match = useLineMatch(product);
  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex w-full min-w-0 flex-col overflow-hidden rounded-lg bg-xxl-white shadow-sm ring-1 ring-xxl-black/5 transition hover:ring-xxl-black/20"
    >
      <div className="relative">
        <ProductImage product={product} className="aspect-square w-full" />
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <Badge badge={product.badge} />
        </div>
        {match && (
          <span
            className={`absolute right-2 bottom-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
              match.status === 'match' ? 'bg-xxl-black text-xxl-white' : 'bg-xxl-white text-xxl-black/70 ring-1 ring-xxl-black/15'
            }`}
          >
            {match.status === 'match' ? `${match.score}% match` : 'Past niet bij jou'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="text-sm leading-tight font-extrabold group-hover:underline">{product.name}</h2>
        <Rating product={product} />
        {flavors && <p className="text-[11px] text-xxl-black/70">{flavors}</p>}
        <CaffeineLabel product={product} />
        <div className="mt-auto pt-2">
          <p className="text-base font-extrabold text-xxl-red">Vanaf {formatEuro(fromPrice(product))}</p>
          <p className="text-[11px] text-xxl-black/70">
            {pps !== null ? `${formatEuro(pps)} per portie` : 'Prijs per portie volgt'}
          </p>
        </div>
      </div>
    </Link>
  );
}
