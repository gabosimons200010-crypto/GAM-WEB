import type { Metadata } from 'next';
import { Bodoni_Moda, Instrument_Sans } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';

const bodoni = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-bodoni' });
const instrument = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-instrument' });

export const metadata: Metadata = {
  title: 'Emporio — Moda peruana, online',
  description: 'Compra ropa de marcas independientes del Perú desde casa. Polos, jeans, casacas y más.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bodoni.variable} ${instrument.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <Suspense fallback={<div className="h-16 border-b border-line bg-paper" />}>
            <Header />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
