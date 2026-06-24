import { Injectable } from '@nestjs/common';
import { Gallery } from '../../domain/gallery.entity';
import { GalleryRepository } from '../ports/gallery.repository';

@Injectable()
export class ListGalleriesUseCase {
  constructor(private readonly galleries: GalleryRepository) {}

  execute(): Promise<Gallery[]> {
    return this.galleries.findAll();
  }
}
