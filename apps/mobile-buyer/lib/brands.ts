// Directorio de marcas de la vitrina. Espejo de apps/web/src/lib/brands.ts:
// cada entrada apunta a su catálogo real en /tienda/[slug] (mismos slugs que el seed).

export interface BrandEntry {
  slug: string;
  name: string;
  bio: string;
  instagram?: string;
  website?: string | null;
  editorialUrl?: string | null;
}

export const BRANDS: BrandEntry[] = [
  {
    slug: 'pepuno',
    name: 'Pepuño',
    bio: 'Moda casual nacida en Gamarra: sobrecamisas, cazadoras y knitwear para hombre y mujer.',
    instagram: '@pepunoclothing',
    website: 'https://pepuno.com',
    editorialUrl: 'https://pepuno.com/web/image/product.template/2048/image_1024/SOBRECAMISA%20SAIRE%20WO',
  },
  {
    slug: 'mister-posh',
    name: 'Mister Posh',
    bio: 'Streetwear limeño de estética racing y siluetas oversize: bombers, hoodies y baggys con la firma MP.',
    instagram: '@misterposh.pe',
    website: 'https://misterposhperu.com',
    editorialUrl: 'https://cdn.shopify.com/s/files/1/0834/7592/3228/files/CASACACUERINAFILPBLACK4.png',
  },
  {
    slug: 'balboni',
    name: 'Balboni',
    bio: '"Changing the Game" desde Jr. Gamarra 949: hoodies, polos oversize y baggys de corte noventero.',
    instagram: '@balboni__',
    website: 'https://balbonistore.com',
    editorialUrl: 'https://balbonistore.com/cdn/shop/files/IMG-5124_e5758a64-f089-4bf9-b9b3-c14ca5036b08.png?v=1780076919',
  },
  {
    slug: 'ntf',
    name: 'NTF',
    bio: 'Nacida en el corazón de Gamarra: polos boxy fit, hoodies y baggy jeans con actitud de calle.',
    instagram: '@ntf.pe',
    website: 'https://linktr.ee/ntf.pe',
    editorialUrl: '/media/ntf/portada.jpg',
  },
  {
    slug: 'fuse-apparel',
    name: 'Fuse Apparel',
    bio: 'Arte & streetwear desde Los Olivos: gráficos de arte local sobre siluetas boxy, en drops limitados.',
    instagram: '@fuseapparelshop',
    website: 'https://www.fuseapprl.com',
    editorialUrl: 'https://www.fuseapprl.com/cdn/shop/files/BANNER_WEB_1_copia.webp',
  },
  {
    slug: 'vanta-studio',
    name: 'Vanta Studio',
    bio: 'Solo básicos pesados: french terry de 480gsm teñido en prenda, costuras selladas a mano.',
    instagram: '@vanta.studio',
    website: null,
    editorialUrl: '/media/lookbook.png',
  },
];

export function getBrandBySlug(slug: string): BrandEntry | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function brandSocials(b: BrandEntry): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  if (b.instagram) out.push({ label: b.instagram, href: `https://instagram.com/${b.instagram.replace(/^@/, '')}` });
  if (b.website) out.push({ label: 'Web', href: b.website });
  return out;
}
