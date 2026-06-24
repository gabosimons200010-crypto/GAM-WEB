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
  /** Lista plana {id, name} — se usa para acotar la taxonomía de la IA (IA-001). */
  abstract flat(): Promise<{ id: string; name: string }[]>;
}
