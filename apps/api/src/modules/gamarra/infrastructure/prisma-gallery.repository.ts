import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Gallery, NewGallery } from '../domain/gallery.entity';
import { GalleryRepository } from '../application/ports/gallery.repository';

/**
 * Adaptador del puerto GalleryRepository sobre Prisma. Es la ÚNICA capa del
 * módulo que conoce Prisma (regla de frontera, docs/01 §1.4).
 */
@Injectable()
export class PrismaGalleryRepository extends GalleryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<Gallery[]> {
    const rows = await this.prisma.gallery.findMany({ orderBy: { name: 'asc' } });
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<Gallery | null> {
    const row = await this.prisma.gallery.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: NewGallery): Promise<Gallery> {
    const row = await this.prisma.gallery.create({
      data: {
        name: data.name,
        address: data.address,
        schedule: (data.schedule ?? undefined) as Prisma.InputJsonValue | undefined,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        mapUrl: data.mapUrl ?? null,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    name: string;
    address: string;
    schedule: Prisma.JsonValue | null;
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
    mapUrl: string | null;
    createdAt: Date;
  }): Gallery {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      schedule: row.schedule ?? null,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      mapUrl: row.mapUrl,
      createdAt: row.createdAt,
    };
  }
}
