'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  getMyStores,
  requestUploadUrl,
  uploadToStorage,
  createAiBatch,
  getAiBatch,
  ClientApiError,
} from '@/lib/client-api';
import type { AIBatch, SellerStore } from '@/lib/types';

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AiUploadPage() {
  const [stores, setStores] = useState<SellerStore[] | null>(null);
  const [storeId, setStoreId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState('');
  const [batch, setBatch] = useState<AIBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    getMyStores()
      .then((s) => {
        setStores(s);
        const approved = s.find((x) => x.status === 'APPROVED') ?? s[0];
        if (approved) setStoreId(approved.id);
      })
      .catch((e) => setError(e instanceof ClientApiError ? e.message : 'Error al cargar tiendas'));
  }, []);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, 20);
    previews.current.forEach((u) => URL.revokeObjectURL(u));
    previews.current = list.map((f) => URL.createObjectURL(f));
    setFiles(list);
    setPhase('idle');
    setBatch(null);
    setError(null);
  }

  async function onProcess() {
    if (!storeId || files.length === 0) return;
    setError(null);
    setPhase('uploading');
    try {
      const keys: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Subiendo ${i + 1}/${files.length}…`);
        const { uploadUrl, key } = await requestUploadUrl(storeId, files[i].type);
        await uploadToStorage(uploadUrl, files[i]);
        keys.push(key);
      }

      setPhase('processing');
      setProgress('Enviando a la IA…');
      const created = await createAiBatch(storeId, keys);
      setBatch(created);

      for (let tries = 0; tries < 90; tries++) {
        await sleep(2000);
        const b = await getAiBatch(storeId, created.id);
        setBatch(b);
        setProgress(`Procesando ${b.processed + b.failed}/${b.total}…`);
        if (b.status === 'DONE' || b.status === 'FAILED') break;
      }
      setPhase('done');
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Falló el procesamiento');
      setPhase('error');
    }
  }

  const busy = phase === 'uploading' || phase === 'processing';

  if (stores === null) return <p className="microcaps text-muted">Cargando…</p>;
  if (stores.length === 0) {
    return (
      <div className="border border-dashed border-line p-12 text-center">
        <p className="font-display text-2xl text-ink">Primero registra una tienda</p>
        <Link href="/vendedor/tienda-nueva" className="microcaps mt-6 inline-block bg-ink px-8 py-3.5 text-paper hover:opacity-80">
          Registrar tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-3">
        <h1 className="font-display text-3xl text-ink">Cargar con IA</h1>
        <p className="microcaps mt-2 text-muted">
          Sube fotos de tus prendas y la IA genera el borrador (nombre, atributos, descripción). Luego revisas el precio y publicas.
        </p>
      </div>

      <p className="microcaps border border-line px-3 py-2 text-[10px] text-muted">
        Necesita el worker corriendo: <code>pnpm --filter @gamarra/api dev:worker</code>. Sin clave de Gemini, la IA usa datos de ejemplo (modo demo).
      </p>

      {error && <p className="microcaps text-sale">{error}</p>}

      <div className="space-y-5">
        {stores.length > 1 && (
          <label className="block">
            <span className="microcaps mb-2 block text-muted">Tienda</span>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="border-b border-ink bg-transparent pb-1 text-[13px] text-ink focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commercialName}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-[#fafafa] p-12 text-center hover:border-ink">
          <span className="microcaps text-ink">Elige fotos de tus prendas</span>
          <span className="microcaps mt-1 text-[10px] text-muted">JPG, PNG o WebP · hasta 20</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onSelect} disabled={busy} className="hidden" />
        </label>

        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {files.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={previews.current[i]} alt={f.name} className="aspect-square w-full object-cover" />
            ))}
          </div>
        )}

        <button
          onClick={onProcess}
          disabled={busy || files.length === 0 || !storeId}
          className="microcaps w-full bg-ink px-4 py-3.5 text-paper transition hover:opacity-80 disabled:opacity-50"
        >
          {busy ? progress || 'Procesando…' : `Procesar ${files.length || ''} foto(s) con IA`}
        </button>
      </div>

      {batch && (phase === 'processing' || phase === 'done') && (
        <div className="border border-line p-5">
          <p className="microcaps text-ink">{phase === 'done' ? 'Procesamiento terminado ✓' : 'Procesando…'}</p>
          <p className="microcaps mt-1 text-[10px] text-muted">
            {batch.processed} procesadas · {batch.failed} con error · {batch.total} en total
          </p>
          {phase === 'done' && (
            <Link href="/vendedor/productos" className="microcaps mt-4 inline-block bg-ink px-6 py-3 text-paper hover:opacity-80">
              Ver borradores en Productos
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
