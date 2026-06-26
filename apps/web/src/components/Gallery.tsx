'use client';

import { useState } from 'react';
import type { MediaView } from '@/lib/types';

/** Galería de imágenes del producto con miniaturas. */
export function Gallery({ media, name }: { media: MediaView[]; name: string }) {
  const images = media.length > 0 ? media : [];
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100 text-6xl text-gray-300">
        👕
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].url} alt={name} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? 'border-brand-500' : 'border-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
