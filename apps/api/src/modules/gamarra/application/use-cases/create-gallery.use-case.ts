import { Injectable } from '@nestjs/common';
import { Gallery, NewGallery } from '../../domain/gallery.entity';
import { GalleryRepository } from '../ports/gallery.repository';

@Injectable()
export class CreateGalleryUseCase {
  constructor(private readonly galleries: GalleryRepository) {}

  execute(data: NewGallery): Promise<Gallery> {
    return this.galleries.create(data);
  }
}
