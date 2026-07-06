'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { ProductCard as ProductCardType } from '@/lib/types';
import { SPIN_VIDEOS } from '@/lib/drop';
import { Price } from './Price';

/** Tarjeta de producto editorial. Si el producto tiene clip 360°, se reproduce al hacer hover. */
export function ProductCard({ product }: { product: ProductCardType }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const spin = SPIN_VIDEOS[product.slug];

  // Listeners nativos (no sintéticos): hover consistente entre navegadores y testeable.
  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;
    const play = () => void video.play().catch(() => {});
    const stop = () => video.pause();
    const toggle = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      video.paused ? play() : stop();
    };
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('pointerdown', toggle);
    return () => {
      card.removeEventListener('mouseenter', play);
      card.removeEventListener('mouseleave', stop);
      card.removeEventListener('pointerdown', toggle);
    };
  }, [spin]);

  return (
    <Link ref={cardRef} href={`/producto/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f4f4]">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="microcaps flex h-full w-full items-center justify-center text-muted">
            {product.name}
          </div>
        )}
        {spin && (
          <>
            <video
              ref={videoRef}
              src={spin}
              muted
              playsInline
              loop
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="microcaps absolute bottom-2 right-2 bg-paper/85 px-1.5 py-0.5 text-[9px] text-ink">
              360°
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <p className="microcaps text-ink group-hover:underline group-hover:underline-offset-4">{product.name}</p>
        <Price price={product.price} salePrice={product.salePrice} />
        <p className="microcaps text-[10px] text-muted">{product.storeName}</p>
      </div>
    </Link>
  );
}
