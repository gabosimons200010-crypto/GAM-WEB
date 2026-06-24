import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';

@ApiTags('categorías (público)')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly listCategories: ListCategoriesUseCase) {}

  @Get()
  @ApiOkResponse({ description: 'Árbol de categorías.' })
  tree() {
    return this.listCategories.execute();
  }
}
