export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: CategoryNode[];
}

export abstract class CategoryRepository {
  abstract tree(): Promise<CategoryNode[]>;
  abstract exists(id: string): Promise<boolean>;
}
