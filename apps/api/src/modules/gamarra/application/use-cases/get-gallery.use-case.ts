import { Injectable, NotFoundException } from '@nestjs/common';
import { Gallery } from '../../domain/gallery.entity';
import { GalleryRepository } from '../ports/gallery.repository';

@Injectable()
export class GetGalleryUseCase {
  constructor(private readonly galleries: GalleryRepository) {}

  async execute(id: string): Promise<Gallery> {
    const gallery = await this.galleries.findById(id);
    if (!gallery) {
      throw new NotFoundException(`Galería ${id} no encontrada`);
    }
    return gallery;
  }
}
