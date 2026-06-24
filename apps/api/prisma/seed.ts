import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Semilla base (Sprint 0): roles, permisos, categorías raíz y galerías de
 * ejemplo de Gamarra. Idempotente (upsert), se puede correr múltiples veces.
 */
async function main(): Promise<void> {
  // ── Roles ──
  const roles: RoleName[] = [
    RoleName.COMPRADOR,
    RoleName.VENDEDOR,
    RoleName.ADMIN_TIENDA,
    RoleName.ADMIN,
    RoleName.SUPER_ADMIN,
  ];
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ── Permisos base ──
  const permissions = [
    'product:read',
    'product:write',
    'order:read:own',
    'order:read:all',
    'store:approve',
    'store:moderate',
    'payment:refund',
    'audit:read',
  ];
  for (const key of permissions) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  // ── Categorías raíz de ropa ──
  const categories = [
    { name: 'Mujer', slug: 'mujer' },
    { name: 'Hombre', slug: 'hombre' },
    { name: 'Niños', slug: 'ninos' },
    { name: 'Vestidos', slug: 'vestidos' },
    { name: 'Polos', slug: 'polos' },
    { name: 'Pantalones', slug: 'pantalones' },
    { name: 'Casacas', slug: 'casacas' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  // ── Galerías de ejemplo de Gamarra ──
  const galleries = [
    { name: 'Galería La Mundial', address: 'Jr. Gamarra 645, La Victoria, Lima' },
    { name: 'Galería Guizado', address: 'Jr. Humboldt 1000, La Victoria, Lima' },
    { name: 'Centro Comercial El Rey', address: 'Av. Aviación 800, La Victoria, Lima' },
  ];
  for (const g of galleries) {
    const exists = await prisma.gallery.findFirst({ where: { name: g.name } });
    if (!exists) {
      await prisma.gallery.create({ data: g });
    }
  }

  console.log('Semilla aplicada: roles, permisos, categorías y galerías.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
