'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/vendedor', label: 'Panel', icon: '📊' },
  { href: '/vendedor/ia', label: 'Cargar con IA', icon: '✨' },
  { href: '/vendedor/productos', label: 'Productos', icon: '👕' },
  { href: '/vendedor/pedidos', label: 'Pedidos', icon: '📦' },
];

export default function SellerLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace('/ingresar?next=/vendedor');
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-3">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-400">Vendedor</p>
        <nav className="space-y-1">
          {NAV.map((n) => {
            const active = n.href === '/vendedor' ? pathname === n.href : pathname.startsWith(n.href);
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
