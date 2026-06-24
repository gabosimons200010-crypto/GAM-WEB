import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  // ── Usuario administrador de prueba (solo dev) ──
  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
  if (adminRole) {
    const passwordHash = await bcrypt.hash('Admin123', 12); // cumple la política
    const admin = await prisma.user.upsert({
      where: { email: 'admin@gamarra.go' },
      update: {},
      create: {
        email: 'admin@gamarra.go',
        passwordHash,
        fullName: 'Admin Gamarra',
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
    console.log('Usuario admin de prueba: admin@gamarra.go / Admin123');
  }

  console.log('Semilla aplicada: roles, permisos, categorías, galerías y admin.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
