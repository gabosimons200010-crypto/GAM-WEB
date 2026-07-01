'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/admin/tiendas', label: 'Tiendas', icon: '🏬' },
  { href: '/admin/moderacion', label: 'Moderación', icon: '🛡️' },
];

function isAdmin(roles: string[]): boolean {
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace('/ingresar?next=/admin/tiendas');
  }, [ready, user, router]);

  if (!ready || !user) return null;

  if (!isAdmin(user.roles)) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-4xl">🚫</p>
        <h1 className="mt-3 text-xl font-bold">Acceso restringido</h1>
        <p className="mt-2 text-sm text-gray-600">Esta sección es solo para administradores.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-3">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-400">Admin</p>
        <nav className="space-y-1">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
