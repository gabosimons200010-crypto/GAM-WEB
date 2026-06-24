import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CategoryRepository, CategoryNode } from '../application/ports/category.repository';

@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async tree(): Promise<CategoryNode[]> {
    const rows = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    const byId = new Map<string, CategoryNode>();
    rows.forEach((r) =>
      byId.set(r.id, { id: r.id, name: r.name, slug: r.slug, imageUrl: r.imageUrl, children: [] }),
    );
    const roots: CategoryNode[] = [];
    rows.forEach((r) => {
      const node = byId.get(r.id)!;
      if (r.parentId && byId.has(r.parentId)) {
        byId.get(r.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { id } });
    return count > 0;
  }

  async flat(): Promise<{ id: string; name: string }[]> {
    return this.prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  }

  async idBySlug(slug: string): Promise<string | null> {
    const row = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    return row?.id ?? null;
  }
}
