/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El proyecto no incluye ESLint en el web (se omite en build); el chequeo de
  // tipos (tsc) sí corre y es el guardián de calidad.
  eslint: { ignoreDuringBuilds: true },
  // Permite servir imágenes de cualquier origen (MinIO local, R2/S3 en prod).
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
