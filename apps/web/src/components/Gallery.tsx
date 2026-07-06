'use client';

import { useState } from 'react';
import type { MediaView } from '@/lib/types';
import { SPIN_VIDEOS } from '@/lib/drop';

/** Galería del producto: imágenes con miniaturas y, si existe, el clip 360°. */
export function Gallery({ media, name, slug }: { media: MediaView[]; name: string; slug?: string }) {
  const spin = slug ? SPIN_VIDEOS[slug] : undefined;
  const images = media.length > 0 ? media : [];
  // -1 representa el clip 360° (si existe, abre con él).
  const [active, setActive] = useState(spin ? -1 : 0);

  if (images.length === 0 && !spin) {
    return (
      <div className="microcaps flex aspect-[3/4] items-center justify-center bg-[#f4f4f4] text-muted">{name}</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f4f4]">
        {active === -1 && spin ? (
          <video src={spin} muted playsInline loop autoPlay className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[active]?.url} alt={name} className="h-full w-full object-cover" />
        )}
        {active === -1 && spin && (
          <span className="microcaps absolute bottom-3 left-3 bg-paper/85 px-1.5 py-0.5 text-[9px] text-ink">
            Vista 360°
          </span>
        )}
      </div>

      {(images.length > 1 || (spin && images.length > 0)) && (
        <div className="flex gap-2 overflow-x-auto">
          {spin && (
            <button
              onClick={() => setActive(-1)}
              className={`microcaps flex h-16 w-14 shrink-0 items-center justify-center bg-[#f4f4f4] text-[9px] ${
                active === -1 ? 'text-ink underline underline-offset-4' : 'text-muted'
              }`}
            >
              360°
            </button>
          )}
          {images.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={`h-16 w-14 shrink-0 overflow-hidden ${i === active ? 'opacity-100 outline outline-1 outline-ink' : 'opacity-70'}`}
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
