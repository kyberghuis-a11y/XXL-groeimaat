import { useState } from 'react';
import type { ProductLine } from '../data/types';

/**
 * Productfoto met automatische placeholder. Foto's staan in public/images/products/<id>.webp
 * (zie de README daar). Ontbreekt de foto, dan tonen we nooit een kapot-afbeelding-icoon.
 */
export function ProductImage({ product, className = '' }: { product: ProductLine; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-xxl-grey p-3 text-center ${className}`}
        role="img"
        aria-label={`${product.name}, XXL Nutrition (foto volgt)`}
      >
        <span className="text-xs font-extrabold tracking-wider text-xxl-black/60 uppercase">{product.category}</span>
        <span className="text-[10px] text-xxl-black/40">Foto volgt</span>
      </div>
    );
  }

  return (
    <img
      src={product.image_url}
      alt={`${product.name}, XXL Nutrition`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`bg-xxl-white object-contain ${className}`}
    />
  );
}
