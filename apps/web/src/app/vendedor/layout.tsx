'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/vendedor', label: 'Panel' },
  { href: '/vendedor/productos', label: 'Productos' },
  { href: '/vendedor/pedidos', label: 'Pedidos' },
  { href: '/vendedor/ventas', label: 'Ventas' },
  { href: '/vendedor/pagos', label: 'Pagos' },
  { href: '/vendedor/ia', label: 'Cargar con IA' },
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
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[190px_1fr]">
      <aside className="h-fit md:sticky md:top-24">
        <p className="microcaps mb-4 text-muted">Vendedor</p>
        <nav className="flex flex-col">
          {NAV.map((n) => {
            const active = n.href === '/vendedor' ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`microcaps border-l-2 py-2.5 pl-3 transition ${
                  active ? 'border-ink text-ink' : 'border-line text-muted hover:border-ink hover:text-ink'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
