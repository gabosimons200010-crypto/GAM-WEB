import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'GAMARRA GO — El emporio de Gamarra, online',
  description: 'Compra ropa de las tiendas de Gamarra (Lima, Perú) desde casa. Polos, jeans, casacas y más.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <Suspense fallback={<div className="h-16 border-b border-gray-200 bg-white" />}>
            <Header />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
