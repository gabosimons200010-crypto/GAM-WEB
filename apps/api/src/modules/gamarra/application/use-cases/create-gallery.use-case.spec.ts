import { CreateGalleryUseCase } from './create-gallery.use-case';
import { GetGalleryUseCase } from './get-gallery.use-case';
import { GalleryRepository } from '../ports/gallery.repository';
import { Gallery, NewGallery } from '../../domain/gallery.entity';
import { NotFoundException } from '@nestjs/common';

/**
 * Demuestra que los casos de uso son testeables sin Prisma ni Nest: se inyecta
 * un repositorio en memoria que cumple el puerto. Es la ventaja del diseño
 * hexagonal (docs/01 §1.4).
 */
class InMemoryGalleryRepository extends GalleryRepository {
  private readonly rows: Gallery[] = [];

  async findAll(): Promise<Gallery[]> {
    return [...this.rows];
  }

  async findById(id: string): Promise<Gallery | null> {
    return this.rows.find((g) => g.id === id) ?? null;
  }

  async create(data: NewGallery): Promise<Gallery> {
    const gallery: Gallery = {
      id: `gal_${this.rows.length + 1}`,
      name: data.name,
      address: data.address,
      schedule: data.schedule ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      mapUrl: data.mapUrl ?? null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    this.rows.push(gallery);
    return gallery;
  }
}

describe('Galerías — casos de uso', () => {
  let repo: InMemoryGalleryRepository;
  let create: CreateGalleryUseCase;
  let get: GetGalleryUseCase;

  beforeEach(() => {
    repo = new InMemoryGalleryRepository();
    create = new CreateGalleryUseCase(repo);
    get = new GetGalleryUseCase(repo);
  });

  it('crea una galería y la recupera por id', async () => {
    const created = await create.execute({
      name: 'Galería La Mundial',
      address: 'Jr. Gamarra 123, La Victoria',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Galería La Mundial');

    const found = await get.execute(created.id);
    expect(found.id).toBe(created.id);
  });

  it('lanza NotFound si la galería no existe', async () => {
    await expect(get.execute('inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });
});
