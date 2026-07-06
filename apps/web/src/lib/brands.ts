// Directorio de marcas de la vitrina (/marcas). Cada entrada apunta a su
// catálogo real en /tienda/[slug] — las tiendas y productos los crea
// apps/api/prisma/demo-seed.ts con los mismos slugs.

export interface BrandEntry {
  slug: string;
  name: string;
  bio: string;
  instagram?: string;
  /** Logo de la marca (URL externa). Si es null, el tile usa el nombre en serif. */
  logoUrl?: string | null;
  /** Foto editorial / campaña para el tile del directorio. */
  editorialUrl?: string | null;
}

export const BRANDS: BrandEntry[] = [
  // ── Marcas peruanas reales (imágenes tomadas de sus tiendas online — solo demo) ──
  {
    slug: 'pepuno',
    name: 'Pepuño',
    bio: 'Moda casual nacida en Gamarra: sobrecamisas, cazadoras y knitwear para hombre y mujer.',
    instagram: '@pepunoclothing',
    logoUrl: 'https://pepuno.com/web/image/website/1/logo/Pepuno',
    editorialUrl: 'https://pepuno.com/web/image/product.template/2048/image_1024/SOBRECAMISA%20SAIRE%20WO',
  },
  {
    slug: 'mister-posh',
    name: 'Mister Posh',
    bio: 'Streetwear limeño de estética racing y siluetas oversize: bombers, hoodies y baggys con la firma MP.',
    instagram: '@misterposh.pe',
    logoUrl: 'https://misterposhperu.com/cdn/shop/files/LOGO_MP-03_ebeb9f69-00f1-4364-b5b8-4c099a3ff4ed.png',
    editorialUrl: 'https://cdn.shopify.com/s/files/1/0834/7592/3228/files/CASACACUERINAFILPBLACK4.png',
  },
  {
    slug: 'balboni',
    name: 'Balboni',
    bio: '"Changing the Game" desde Jr. Gamarra 949: hoodies, polos oversize y baggys de corte noventero.',
    instagram: '@balboni__',
    logoUrl: 'https://balbonistore.com/cdn/shop/files/NUEVO_LOGO_BALBONI_2.png?v=1778603173',
    editorialUrl: 'https://balbonistore.com/cdn/shop/files/IMG-5124_e5758a64-f089-4bf9-b9b3-c14ca5036b08.png?v=1780076919',
  },
  {
    slug: 'ntf',
    name: 'NTF',
    bio: 'Nacida en el corazón de Gamarra: polos boxy fit, hoodies y baggy jeans con actitud de calle.',
    instagram: '@ntf.pe',
    logoUrl: null,
    editorialUrl: null,
  },
  {
    slug: 'fuse-apparel',
    name: 'Fuse Apparel',
    bio: 'Arte & streetwear desde Los Olivos: gráficos de arte local sobre siluetas boxy, en drops limitados.',
    instagram: '@fuseapparelshop',
    logoUrl: 'https://www.fuseapprl.com/cdn/shop/files/fuseapprl-negro_5785970c-6e2c-48a1-a779-a797f4fda25f.png',
    editorialUrl: 'https://www.fuseapprl.com/cdn/shop/files/BANNER_WEB_1_copia.webp',
  },
  // ── Marca de la cápsula Midnight ──
  {
    slug: 'vanta-studio',
    name: 'Vanta Studio',
    bio: 'Solo básicos pesados: french terry de 480gsm teñido en prenda, costuras selladas a mano.',
    editorialUrl: '/media/lookbook.png',
  },
];
