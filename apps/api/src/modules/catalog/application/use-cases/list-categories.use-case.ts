import { Injectable } from '@nestjs/common';
import { CategoryRepository, CategoryNode } from '../ports/category.repository';

@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(): Promise<CategoryNode[]> {
    return this.categories.tree();
  }
}
