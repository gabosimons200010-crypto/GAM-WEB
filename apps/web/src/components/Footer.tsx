export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500">
        <p className="font-semibold text-gray-700">
          GAMARRA <span className="text-brand-600">GO</span>
        </p>
        <p className="mt-1">El emporio de Gamarra, ahora online. Lima, Perú.</p>
        <p className="mt-4 text-xs text-gray-400">© {new Date().getFullYear()} GAMARRA GO · Demo Fase 2</p>
      </div>
    </footer>
  );
}
