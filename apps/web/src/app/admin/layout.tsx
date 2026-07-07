'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/admin/tiendas', label: 'Tiendas' },
  { href: '/admin/moderacion', label: 'Moderación' },
  { href: '/admin/tendencias', label: 'Tendencias' },
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
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-3xl text-ink">Acceso restringido</h1>
        <p className="microcaps mt-3 text-muted">Esta sección es solo para administradores.</p>
        <Link href="/" className="microcaps mt-8 inline-block bg-ink px-10 py-3.5 text-paper hover:opacity-80">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[190px_1fr]">
      <aside className="h-fit md:sticky md:top-24">
        <p className="microcaps mb-4 text-muted">Admin</p>
        <nav className="flex flex-col">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
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
