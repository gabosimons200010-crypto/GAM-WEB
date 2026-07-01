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
      // 1) Sube cada imagen al storage con URL prefirmada.
      const keys: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Subiendo ${i + 1}/${files.length}…`);
        const { uploadUrl, key } = await requestUploadUrl(storeId, files[i].type);
        await uploadToStorage(uploadUrl, files[i]);
        keys.push(key);
      }

      // 2) Crea el lote de IA.
      setPhase('processing');
      setProgress('Enviando a la IA…');
      const created = await createAiBatch(storeId, keys);
      setBatch(created);

      // 3) Poll del estado hasta DONE/FAILED (máx ~3 min).
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

  if (stores === null) return <p className="text-gray-500">Cargando…</p>;
  if (stores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        <p className="text-3xl">🏬</p>
        <p className="mt-2 font-medium">Primero registra una tienda</p>
        <Link href="/vendedor/tienda-nueva" className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Registrar tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Cargar productos con IA ✨</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube fotos de tus prendas y la IA genera el borrador (nombre, atributos, descripción). Luego revisas el precio y publicas.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
        ⚙️ Necesita el <b>worker</b> corriendo: <code>pnpm --filter @gamarra/api dev:worker</code>. Sin clave de Gemini,
        la IA usa datos de ejemplo (modo demo).
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        {stores.length > 1 && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Tienda</span>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commercialName}
                </option>
              ))}
            </select>
          </label>
        )}

        <div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center hover:border-brand-400">
            <span className="text-4xl">📷</span>
            <span className="mt-2 text-sm font-medium text-gray-700">Elige fotos de tus prendas</span>
            <span className="text-xs text-gray-400">JPG, PNG o WebP · hasta 20</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onSelect} disabled={busy} className="hidden" />
          </label>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {files.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={previews.current[i]} alt={f.name} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        )}

        <button
          onClick={onProcess}
          disabled={busy || files.length === 0 || !storeId}
          className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? progress || 'Procesando…' : `Procesar ${files.length || ''} foto(s) con IA`}
        </button>
      </div>

      {batch && (phase === 'processing' || phase === 'done') && (
        <div className={`rounded-xl border p-5 ${phase === 'done' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
          <p className="text-sm font-semibold">
            {phase === 'done' ? '✅ Procesamiento terminado' : '⏳ Procesando…'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {batch.processed} procesadas · {batch.failed} con error · {batch.total} en total
          </p>
          {phase === 'done' && (
            <Link href="/vendedor/productos" className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
              Ver borradores en Productos →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
