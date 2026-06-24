import { Gallery, NewGallery } from '../../domain/gallery.entity';

/**
 * Puerto (interfaz) del repositorio de galerías. La capa de aplicación depende
 * de esta abstracción, no de Prisma. La clase abstracta actúa como token de
 * inyección en NestJS. El adaptador concreto vive en infrastructure/.
 */
export abstract class GalleryRepository {
  abstract findAll(): Promise<Gallery[]>;
  abstract findById(id: string): Promise<Gallery | null>;
  abstract create(data: NewGallery): Promise<Gallery>;
}
