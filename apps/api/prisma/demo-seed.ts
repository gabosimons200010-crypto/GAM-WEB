import { PrismaClient, ProductStatus, RoleName, StoreStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

/** Catálogo real de NTF extraído de los PDFs (fotos en apps/web/public/media/ntf). */
type NtfCatalogItem = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categorySlug: string;
  tags: string[];
  imageUrl: string;
  soldCount: number;
  sizes: string[];
};
const ntfCatalog: NtfCatalogItem[] = JSON.parse(
  readFileSync(join(process.cwd(), 'prisma', 'ntf-catalog.json'), 'utf8'),
);

/**
 * Deriva tags de estilo/look (vocabulario controlado) a partir de los tags,
 * nombre y categoría. Metadata solo-admin que alimenta el panel de tendencias.
 */
function styleTagsFor(p: { tags?: string[]; name: string; categorySlug: string }): string[] {
  const hay = `${(p.tags ?? []).join(' ')} ${p.name} ${p.categorySlug}`.toLowerCase();
  const out = new Set<string>();
  const add = (cond: boolean, ...t: string[]) => cond && t.forEach((x) => out.add(x));
  add(/boxy|oversize/.test(hay), 'oversize');
  add(/basic|básic/.test(hay), 'básico');
  add(/hoodie|polera|casaca|capucha|zip|chaqueta|jacket|bomber|sweater|abrigo/.test(hay), 'abrigo');
  add(/jean|denim|baggy|pantal|pant\b/.test(hay), 'denim');
  add(/short|sin mangas|tank|manga 0/.test(hay), 'verano');
  add(/camisa|sobrecamisa/.test(hay), 'formal-casual');
  add(/manga larga|heavy|pesad/.test(hay), 'pesado');
  add(/grafi|graffiti|diseño|estampa|flock|print|gráfic|flores|tribal|naipe/.test(hay), 'gráfico');
  add(/racing|sport|deport/.test(hay), 'deportivo');
  add(/polo|tee|camiseta/.test(hay), 'casual');
  add(/ntf|balboni|mister ?posh|racing/.test(hay), 'streetwear');
  add(out.size === 0, 'casual');
  return [...out];
}

/**
 * Semilla DEMO (encima de la base): un vendedor con tiendas APROBADAS y
 * productos ACTIVOS para que la vitrina (/,/buscar, /producto, /tienda) muestre
 * contenido. Re-ejecutable: borra por slug (cascade) y vuelve a crear.
 *
 * Incluye el "MIDNIGHT DROP": 3 marcas independientes (Vanta Studio, Gravel
 * Works, Onyx Supply) con una pieza cada una. Los slugs de esos productos
 * están cableados en apps/web/src/lib/drop.ts (hero + clips 360°).
 *
 * Correr con: pnpm --filter @gamarra/api exec ts-node prisma/demo-seed.ts
 */

// Incluye slugs retirados (moda-lima, gravel-works, onyx-supply) para que el
// deleteMany los purgue de bases sembradas con versiones anteriores.
const STORE_SLUGS = [
  'moda-lima-gamarra',
  'vanta-studio',
  'gravel-works',
  'onyx-supply',
  'pepuno',
  'mister-posh',
  'balboni',
  'ntf',
  'fuse-apparel',
  'prueba-studio',
];

type VariantSeed = { size: string; stock: number };
type ProductSeed = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  gender: 'HOMBRE' | 'MUJER' | 'UNISEX';
  price: number;
  salePrice?: number;
  tags: string[];
  categorySlug: string;
  imageUrls: string[];
  soldCount?: number;
  variants: VariantSeed[];
};

type StoreSeed = {
  slug: string;
  commercialName: string;
  email: string;
  phone: string;
  floor: string;
  stand: string;
  description: string;
  verified: boolean;
  salesCount: number;
  products: ProductSeed[];
};

const SIZES = ['S', 'M', 'L', 'XL'];
const picsum = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;

const STORES: StoreSeed[] = [
  // ── Marca de la cápsula Midnight ──
  {
    slug: 'vanta-studio',
    commercialName: 'Vanta Studio',
    email: 'hola@vantastudio.pe',
    phone: '999333444',
    floor: '3',
    stand: '317',
    description:
      'Solo básicos pesados. French terry de 480gsm, teñido en prenda negro mate, costuras selladas a mano en un taller de seis personas. Vendedor #0047 del marketplace.',
    verified: true,
    salesCount: 47,
    products: [
      {
        sku: 'VS-HW01',
        name: 'Hoodie Heavyweight',
        slug: 'hoodie-heavyweight-vanta',
        description:
          'Hoodie oversize de 480gsm en negro mate con cierre de metal cromado en el cuello y logo tonal grabado al pecho. Parte de la cápsula MIDNIGHT DROP. Hecho pesado. Corte limpio.',
        gender: 'UNISEX',
        price: 180,
        tags: ['hoodie', 'heavyweight', 'drop', 'midnight'],
        categorySlug: 'polos',
        imageUrls: ['/media/lookbook.png'],
        soldCount: 12,
        variants: [
          { size: 'S', stock: 8 },
          { size: 'M', stock: 0 }, // agotada — ejercita el "avísame"
          { size: 'L', stock: 6 },
          { size: 'XL', stock: 4 },
        ],
      },
    ],
  },
  // ── Marcas peruanas reales (datos e imágenes de sus tiendas online; ver web/lib/brands.ts) ──
  {
    slug: 'pepuno',
    commercialName: 'Pepuño',
    email: 'hola@pepuno.com',
    phone: '999000001',
    floor: '1',
    stand: '112',
    description:
      'Marca peruana de moda casual nacida en Gamarra, con líneas para hombre y mujer. Prendas clave del guardarropa moderno: sobrecamisas, cazadoras y knitwear. Envíos a todo el Perú. IG @pepunoclothing.',
    verified: true,
    salesCount: 312,
    products: [
      {
        sku: 'PP-001',
        name: 'Sobrecamisa Saire',
        slug: 'sobrecamisa-saire-pepuno',
        description: 'Sobrecamisa de silueta relajada, tejido con cuerpo y acabado suave. Pieza clave de entretiempo.',
        gender: 'MUJER',
        price: 149,
        tags: ['sobrecamisa', 'pepuno'],
        categorySlug: 'casacas',
        imageUrls: ['https://pepuno.com/web/image/product.template/2048/image_1024/SOBRECAMISA%20SAIRE%20WO'],
        soldCount: 41,
        variants: SIZES.map((size) => ({ size, stock: 12 })),
      },
      {
        sku: 'PP-002',
        name: 'Cazadora Harm',
        slug: 'cazadora-harm-pepuno',
        description: 'Cazadora corta de corte limpio con cierre metálico. Silueta moderna para todos los días.',
        gender: 'MUJER',
        price: 159,
        tags: ['cazadora', 'pepuno'],
        categorySlug: 'casacas',
        imageUrls: ['https://pepuno.com/web/image/product.template/1238/image_1024/CAZADORA%20HARM%20WO'],
        soldCount: 27,
        variants: SIZES.map((size) => ({ size, stock: 10 })),
      },
      {
        sku: 'PP-003',
        name: 'Sweater Kate',
        slug: 'sweater-kate-pepuno',
        description: 'Sweater de punto medio, cuello redondo y caída suave. Knitwear esencial.',
        gender: 'MUJER',
        price: 119,
        tags: ['sweater', 'knitwear', 'pepuno'],
        categorySlug: 'polos',
        imageUrls: ['https://pepuno.com/web/image/product.template/1817/image_1024/SWEATER%20KATE%20WO'],
        soldCount: 33,
        variants: SIZES.map((size) => ({ size, stock: 14 })),
      },
      {
        sku: 'PP-004',
        name: 'Pant Lea',
        slug: 'pant-lea-pepuno',
        description: 'Pantalón de pierna recta con pretina cómoda. Corte pulcro, uso diario.',
        gender: 'MUJER',
        price: 119,
        tags: ['pantalon', 'pepuno'],
        categorySlug: 'pantalones',
        imageUrls: ['https://pepuno.com/web/image/product.template/2049/image_1024/PANT%20LEA%20WO'],
        soldCount: 19,
        variants: SIZES.map((size) => ({ size, stock: 11 })),
      },
      {
        sku: 'PP-005',
        name: 'Polera Cam',
        slug: 'polera-cam-pepuno',
        description: 'Polera de algodón con interior suave y capucha amplia.',
        gender: 'UNISEX',
        price: 119,
        tags: ['polera', 'pepuno'],
        categorySlug: 'polos',
        imageUrls: ['https://pepuno.com/web/image/product.template/1850/image_1024/POLERA%20CAM%20VAL'],
        soldCount: 22,
        variants: SIZES.map((size) => ({ size, stock: 16 })),
      },
      {
        sku: 'PP-006',
        name: 'Chaqueta Savage',
        slug: 'chaqueta-savage-pepuno',
        description: 'Chaqueta estructurada con hombro marcado y cierre frontal.',
        gender: 'MUJER',
        price: 149,
        tags: ['chaqueta', 'pepuno'],
        categorySlug: 'casacas',
        imageUrls: ['https://pepuno.com/web/image/product.template/1244/image_1024/CHAQUETA%20SAVAGE%20WO'],
        soldCount: 15,
        variants: SIZES.map((size) => ({ size, stock: 9 })),
      },
    ],
  },
  {
    slug: 'mister-posh',
    commercialName: 'Mister Posh',
    email: 'ventas@misterposhperu.com',
    phone: '999000002',
    floor: '2',
    stand: '205',
    description:
      'Streetwear limeño de estética racing y siluetas oversize: bombers, hoodies y baggy jeans con la firma MP. Tiendas físicas en Los Olivos y línea hermana Lady Posh. IG @misterposh.pe.',
    verified: true,
    salesCount: 486,
    products: [
      {
        sku: 'MP-001',
        name: 'Bomber MP Acero',
        slug: 'bomber-mp-acero',
        description: 'Bomber oversize en tono acero con firma MP. Estética racing, forro interno liviano.',
        gender: 'HOMBRE',
        price: 169,
        tags: ['bomber', 'racing', 'misterposh'],
        categorySlug: 'casacas',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0834/7592/3228/files/BOMBERMPACERO.png?v=1783190573'],
        soldCount: 58,
        variants: SIZES.map((size) => ({ size, stock: 10 })),
      },
      {
        sku: 'MP-002',
        name: 'Bomber MP Black',
        slug: 'bomber-mp-black',
        description: 'Bomber oversize negro con firma MP bordada. El clásico de la casa.',
        gender: 'HOMBRE',
        price: 169,
        tags: ['bomber', 'misterposh'],
        categorySlug: 'casacas',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0834/7592/3228/files/BOMBERMPBLACK.png?v=1783190532'],
        soldCount: 73,
        variants: [
          { size: 'S', stock: 6 },
          { size: 'M', stock: 0 }, // agotada — ejercita el "avísame"
          { size: 'L', stock: 8 },
          { size: 'XL', stock: 5 },
        ],
      },
      {
        sku: 'MP-003',
        name: 'Bomber Militar',
        slug: 'bomber-militar-mp',
        description: 'Bomber en verde militar con bolsillos utilitarios y puños acanalados.',
        gender: 'HOMBRE',
        price: 189,
        tags: ['bomber', 'militar', 'misterposh'],
        categorySlug: 'casacas',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0834/7592/3228/files/BOMBERMILITAR.png?v=1783190174'],
        soldCount: 34,
        variants: SIZES.map((size) => ({ size, stock: 7 })),
      },
      {
        sku: 'MP-004',
        name: 'Hoodie FILP 4:13 Blue',
        slug: 'hoodie-filp-413-blue',
        description: 'Hoodie oversize azul de la línea FILP con gráfico 4:13 al pecho.',
        gender: 'HOMBRE',
        price: 149,
        tags: ['hoodie', 'filp', 'misterposh'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0834/7592/3228/files/HODDIEFILP413BLUE.png?v=1782848067'],
        soldCount: 46,
        variants: SIZES.map((size) => ({ size, stock: 12 })),
      },
      {
        sku: 'MP-005',
        name: 'Racing R FILP Melange',
        slug: 'racing-r-filp-melange',
        description: 'Polera racing melange con gráficos R FILP. Silueta amplia.',
        gender: 'HOMBRE',
        price: 159,
        tags: ['racing', 'polera', 'misterposh'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0834/7592/3228/files/RACINGRFILPMELANGE3.png?v=1782422107'],
        soldCount: 29,
        variants: SIZES.map((size) => ({ size, stock: 9 })),
      },
      {
        sku: 'MP-006',
        name: 'Short MP Lineal Blue',
        slug: 'short-mp-lineal-blue',
        description: 'Short azul con franja lineal MP. Tejido ligero para diario.',
        gender: 'HOMBRE',
        price: 79,
        tags: ['short', 'misterposh'],
        categorySlug: 'pantalones',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0834/7592/3228/files/SHORTMPLINEALBLUE2.png?v=1782421834'],
        soldCount: 51,
        variants: SIZES.map((size) => ({ size, stock: 15 })),
      },
    ],
  },
  {
    slug: 'balboni',
    commercialName: 'Balboni',
    email: 'hola@balbonistore.com',
    phone: '999000003',
    floor: '1',
    stand: '949', // Jr. Gamarra 949, Galería Estilo
    description:
      'Balboni Studios — "Changing the Game". Streetwear nacido en Gamarra (Jr. Gamarra 949, Galería Estilo): hoodies, polos oversize y baggys de corte noventero con campañas editoriales juveniles. IG @balboni__.',
    verified: true,
    salesCount: 264,
    products: [
      {
        sku: 'BB-001',
        name: 'Hoodie Studios Sand',
        slug: 'hoodie-studios-sand',
        description: 'Hoodie oversize en tono arena con bordado Studios. Algodón de gramaje medio-alto.',
        gender: 'UNISEX',
        price: 129,
        tags: ['hoodie', 'balboni'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0687/5493/1988/files/12_38d804dc-ebae-470f-a89a-d44f1327a650.png?v=1780611806'],
        soldCount: 62,
        variants: SIZES.map((size) => ({ size, stock: 13 })),
      },
      {
        sku: 'BB-002',
        name: 'Casaca Trinity Blue',
        slug: 'casaca-trinity-blue',
        description: 'Casaca Trinity en azul con paneles contrastados y cierre completo.',
        gender: 'UNISEX',
        price: 159,
        tags: ['casaca', 'balboni'],
        categorySlug: 'casacas',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0687/5493/1988/files/TRINITY-2_69ab6d90-b002-4733-8595-5d12661ad805.png?v=1773960304'],
        soldCount: 21,
        variants: SIZES.map((size) => ({ size, stock: 8 })),
      },
      {
        sku: 'BB-003',
        name: 'Polo Oversize Verde Militar',
        slug: 'polo-oversize-verde-militar',
        description: 'Polo oversize en verde militar, hombro caído y cuello reforzado.',
        gender: 'UNISEX',
        price: 49,
        tags: ['polo', 'oversize', 'balboni'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0687/5493/1988/files/10_96d4442f-55fc-474a-915c-b909b4aecdf8.png?v=1773701950'],
        soldCount: 88,
        variants: SIZES.map((size) => ({ size, stock: 20 })),
      },
      {
        sku: 'BB-004',
        name: 'Jacket Franchitti Black',
        slug: 'jacket-franchitti-black',
        description: 'Jacket Franchitti negra de inspiración racing con parches bordados.',
        gender: 'UNISEX',
        price: 189,
        tags: ['jacket', 'racing', 'balboni'],
        categorySlug: 'casacas',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0687/5493/1988/files/PRENDA-SUPERIOR-13.png?v=1777590632'],
        soldCount: 17,
        variants: [
          { size: 'S', stock: 5 },
          { size: 'M', stock: 7 },
          { size: 'L', stock: 0 }, // agotada
          { size: 'XL', stock: 4 },
        ],
      },
      {
        sku: 'BB-005',
        name: 'Stone Baggy Black',
        slug: 'stone-baggy-black',
        description: 'Baggy negro de corte noventero con lavado stone. Pierna amplia.',
        gender: 'UNISEX',
        price: 89,
        tags: ['baggy', 'balboni'],
        categorySlug: 'pantalones',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0687/5493/1988/files/pan32.jpg?v=1769786917'],
        soldCount: 44,
        variants: SIZES.map((size) => ({ size, stock: 12 })),
      },
      {
        sku: 'BB-006',
        name: 'Shirt Klim Black',
        slug: 'shirt-klim-black',
        description: 'Camisa Klim negra de silueta boxy con botones tonales.',
        gender: 'UNISEX',
        price: 99,
        tags: ['camisa', 'balboni'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0687/5493/1988/files/CAMISA-1.png?v=1773863798'],
        soldCount: 26,
        variants: SIZES.map((size) => ({ size, stock: 10 })),
      },
    ],
  },
  {
    slug: 'ntf',
    commercialName: 'NTF',
    email: 'ventas@ntf.pe',
    phone: '904829098',
    floor: '3',
    stand: 'El Paraíso', // galerías El Paraíso y Generación Gamarra
    description:
      'Streetwear nacido en el corazón de Gamarra, con tiendas físicas en las galerías El Paraíso y Generación Gamarra. Polos boxy fit, hoodies y baggy jeans con actitud de calle. Venta por IG/TikTok @ntf.pe — envíos a todo el Perú.',
    verified: true,
    salesCount: 197,
    // Catálogo real NTF 2025 (115 prendas extraídas de los PDFs) — ver ntf-catalog.json.
    products: ntfCatalog.map((p) => ({
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      description: p.description,
      gender: 'UNISEX' as const,
      price: p.price,
      tags: p.tags,
      categorySlug: p.categorySlug,
      imageUrls: [p.imageUrl],
      soldCount: p.soldCount,
      variants: p.sizes.map((size) => ({ size, stock: 15 })),
    })),
  },
  {
    slug: 'fuse-apparel',
    commercialName: 'Fuse Apparel',
    email: 'hola@fuseapprl.com',
    phone: '999000005',
    floor: '2',
    stand: '230',
    description:
      'Arte & streetwear desde Los Olivos, Lima: gráficos fuertes de arte local sobre siluetas boxy fit. Colecciones en drops de edición limitada — tees, hoodies, jorts y jeans. IG @fuseapparelshop.',
    verified: true,
    salesCount: 158,
    products: [
      {
        sku: 'FS-001',
        name: 'Hoodie Boxy Fit Society Black',
        slug: 'hoodie-boxy-society-black',
        description: 'Hoodie boxy fit negro con gráfico Society. Edición limitada.',
        gender: 'UNISEX',
        price: 139,
        tags: ['hoodie', 'boxy', 'fuse'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0764/0619/4276/files/HOODIEBOXYFITSOCIETYBLACK0.webp?v=1778905135'],
        soldCount: 36,
        variants: SIZES.map((size) => ({ size, stock: 8 })),
      },
      {
        sku: 'FS-002',
        name: 'Hoodie Sacred Trace Black',
        slug: 'hoodie-sacred-trace-black',
        description: 'Hoodie negro con gráfico Sacred Trace en espalda. Drop limitado.',
        gender: 'UNISEX',
        price: 139,
        tags: ['hoodie', 'fuse'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0764/0619/4276/files/HOODIESACREDTRACEBLACK0.webp?v=1778906286'],
        soldCount: 24,
        variants: SIZES.map((size) => ({ size, stock: 7 })),
      },
      {
        sku: 'FS-003',
        name: 'Tee Boxy Beyond Limits Black',
        slug: 'tee-boxy-beyond-limits-black',
        description: 'Tee boxy negra con gráfico Beyond Limits. Algodón pesado.',
        gender: 'UNISEX',
        price: 79,
        tags: ['tee', 'boxy', 'fuse'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0764/0619/4276/files/TeeBoxyBeyondLimitsBlack2.webp?v=1772251363'],
        soldCount: 43,
        variants: SIZES.map((size) => ({ size, stock: 14 })),
      },
      {
        sku: 'FS-004',
        name: 'Tee Boxy Demonic Focus White',
        slug: 'tee-boxy-demonic-focus-white',
        description: 'Tee boxy blanca con gráfico Demonic Focus al frente.',
        gender: 'UNISEX',
        price: 79,
        tags: ['tee', 'fuse'],
        categorySlug: 'polos',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0764/0619/4276/files/TeeBoxyDemonicFocusWhite6.webp?v=1772251440'],
        soldCount: 31,
        variants: SIZES.map((size) => ({ size, stock: 12 })),
      },
      {
        sku: 'FS-005',
        name: 'Pants Jean Night Wash Black',
        slug: 'pants-jean-night-wash-black',
        description: 'Jean negro con lavado nocturno, corte relajado.',
        gender: 'UNISEX',
        price: 149,
        tags: ['jean', 'fuse'],
        categorySlug: 'pantalones',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0764/0619/4276/files/PANTSJEANNIGHTWASHBLACK0.webp?v=1778905408'],
        soldCount: 18,
        variants: SIZES.map((size) => ({ size, stock: 9 })),
      },
      {
        sku: 'FS-006',
        name: 'Jort Raw Denim Cut Blue',
        slug: 'jort-raw-denim-cut-blue',
        description: 'Jort de denim crudo con corte amplio, azul clásico.',
        gender: 'UNISEX',
        price: 119,
        tags: ['jort', 'denim', 'fuse'],
        categorySlug: 'pantalones',
        imageUrls: ['https://cdn.shopify.com/s/files/1/0764/0619/4276/files/JORTRAWDENIMCUTBLUE6.webp?v=1772255197'],
        soldCount: 27,
        variants: SIZES.map((size) => ({ size, stock: 11 })),
      },
    ],
  },
];

async function main(): Promise<void> {
  // ── Vendedor demo ──
  const sellerRole = await prisma.role.findUnique({ where: { name: RoleName.VENDEDOR } });
  if (!sellerRole) throw new Error('Corre primero la semilla base (pnpm db:seed): falta el rol VENDEDOR.');

  const passwordHash = await bcrypt.hash('Vendedor123', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@gamarra.go' },
    update: {},
    create: {
      email: 'vendedor@gamarra.go',
      passwordHash,
      fullName: 'Vendedor Demo',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: seller.id, roleId: sellerRole.id } },
    update: {},
    create: { userId: seller.id, roleId: sellerRole.id },
  });

  // ── Re-ejecutable ──
  // Borra pedidos demo previos primero: sus OrderItem referencian variantes de
  // estas tiendas (FK Restrict), así que sin esto el borrado de tiendas falla.
  await prisma.order.deleteMany({});
  await prisma.store.deleteMany({ where: { slug: { in: STORE_SLUGS } } }); // cascade: productos, variantes

  const gallery = await prisma.gallery.findFirst();
  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const s of STORES) {
    const store = await prisma.store.create({
      data: {
        slug: s.slug,
        commercialName: s.commercialName,
        email: s.email,
        phone: s.phone,
        galleryId: gallery?.id,
        floor: s.floor,
        stand: s.stand,
        description: s.description,
        status: StoreStatus.APPROVED,
        verified: s.verified,
        salesCount: s.salesCount,
        approvedAt: new Date(),
        memberships: { create: { userId: seller.id, storeRole: RoleName.ADMIN_TIENDA } },
      },
    });

    for (const p of s.products) {
      await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: categoryBySlug.get(p.categorySlug) ?? null,
          sku: p.sku,
          name: p.name,
          slug: p.slug,
          description: p.description,
          gender: p.gender,
          price: p.price,
          salePrice: p.salePrice ?? null,
          status: ProductStatus.ACTIVE,
          tags: p.tags,
          styleTags: styleTagsFor(p),
          soldCount: p.soldCount ?? 0,
          media: {
            create: p.imageUrls.map((url, i) => ({ kind: 'ORIGINAL', url, position: i })),
          },
          variants: {
            create: p.variants.map((v) => ({
              sku: `${p.sku}-${v.size}`,
              size: v.size,
              inventory: { create: { available: v.stock } },
            })),
          },
        },
      });
    }
    console.log(`Tienda demo lista: ${s.commercialName} (${s.products.length} productos)`);
  }

  // ── Cuentas ficticias para explorar: un cliente y un vendedor con su tienda ──
  const buyerRole = await prisma.role.findUnique({ where: { name: RoleName.COMPRADOR } });

  async function ensureUser(email: string, password: string, fullName: string, roleId?: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, fullName, status: 'ACTIVE', emailVerified: new Date() },
    });
    if (roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId },
      });
    }
    return user;
  }

  await ensureUser('cliente.demo@emporio.pe', 'Cliente123', 'Cliente Demo', buyerRole?.id);
  const demoSeller = await ensureUser('vendedor.demo@emporio.pe', 'Vendedor123', 'Vendedora Demo', sellerRole.id);

  // Tienda propia del vendedor demo (independiente de las marcas curadas).
  const demoStore = await prisma.store.create({
    data: {
      slug: 'prueba-studio',
      commercialName: 'Prueba Studio',
      email: 'hola@pruebastudio.pe',
      phone: '999123456',
      galleryId: gallery?.id,
      floor: '1',
      stand: '101',
      description:
        'Tienda de demostración del vendedor de prueba. Prendas de ejemplo para explorar el panel del vendedor (productos, inventario, pedidos, ventas y pagos).',
      status: StoreStatus.APPROVED,
      verified: true,
      salesCount: 0,
      approvedAt: new Date(),
      memberships: { create: { userId: demoSeller.id, storeRole: RoleName.ADMIN_TIENDA } },
    },
  });

  const demoProducts = [
    { sku: 'PS-01', name: 'Polo Demo Blanco', slug: 'polo-demo-blanco', price: 59, cat: 'polos' },
    { sku: 'PS-02', name: 'Hoodie Demo Negro', slug: 'hoodie-demo-negro', price: 129, cat: 'polos' },
    { sku: 'PS-03', name: 'Pantalón Demo Beige', slug: 'pantalon-demo-beige', price: 99, cat: 'pantalones' },
  ];
  for (const p of demoProducts) {
    await prisma.product.create({
      data: {
        storeId: demoStore.id,
        categoryId: categoryBySlug.get(p.cat) ?? null,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: 'Producto de demostración de Prueba Studio.',
        gender: 'UNISEX',
        price: p.price,
        status: ProductStatus.ACTIVE,
        tags: ['demo'],
        styleTags: styleTagsFor({ tags: ['demo'], name: p.name, categorySlug: p.cat }),
        media: { create: [{ kind: 'ORIGINAL', url: '/media/ph-demo.svg', position: 0 }] },
        variants: {
          create: ['S', 'M', 'L', 'XL'].map((size) => ({
            sku: `${p.sku}-${size}`,
            size,
            inventory: { create: { available: 20 } },
          })),
        },
      },
    });
  }
  console.log('Tienda demo lista: Prueba Studio (3 productos)');

  // ── Cupones de descuento demo ──
  const coupons: { code: string; scope: 'GLOBAL'; type: 'PERCENT' | 'FIXED'; value: number; minPurchase: number | null }[] = [
    { code: 'BIENVENIDA10', scope: 'GLOBAL', type: 'PERCENT', value: 10, minPurchase: null },
    { code: 'GAMARRA20', scope: 'GLOBAL', type: 'FIXED', value: 20, minPurchase: 100 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { active: true, type: c.type, value: c.value, minPurchase: c.minPurchase },
      create: { code: c.code, scope: c.scope, type: c.type, value: c.value, minPurchase: c.minPurchase, active: true },
    });
  }
  console.log('Cupones demo: BIENVENIDA10 (10%), GAMARRA20 (S/20, mín. S/100)');

  console.log('Semilla demo aplicada.');
  console.log('  Vendedor (marcas):  vendedor@gamarra.go / Vendedor123');
  console.log('  Vendedor de prueba: vendedor.demo@emporio.pe / Vendedor123 (tienda Prueba Studio)');
  console.log('  Cliente de prueba:  cliente.demo@emporio.pe / Cliente123');
  console.log('  Admin:              admin@gamarra.go / Admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
