import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateProductUseCase } from 'src/modules/products/application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from 'src/modules/products/application/use-cases/delete-product.use-case';
import { FindProductUseCase } from 'src/modules/products/application/use-cases/find-product.use-case';
import { UpdateProductUseCase } from 'src/modules/products/application/use-cases/update-product.use-case';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductViewModel } from '../view-models/product.view-model';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly findProduct: FindProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista produtos' })
  @ApiOkResponse({ description: 'Produtos encontrados.' })
  async findAll() {
    const products = await this.findProduct.all();
    return { products: products.map(ProductViewModel.toHTTP) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto por ID' })
  @ApiParam({ name: 'id', description: 'UUID do produto' })
  async findById(@Param('id') id: string) {
    return { product: ProductViewModel.toHTTP(await this.findProduct.byId(id)) };
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um produto de brinde' })
  @ApiCreatedResponse({ description: 'Produto criado.' })
  async create(@Body() dto: CreateProductDto) {
    return { product: ProductViewModel.toHTTP(await this.createProduct.execute(dto)) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza ou desativa um produto' })
  @ApiParam({ name: 'id', description: 'UUID do produto' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return { product: ProductViewModel.toHTTP(await this.updateProduct.execute(id, dto)) };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui um produto sem itens de oportunidade' })
  @ApiParam({ name: 'id', description: 'UUID do produto' })
  @ApiNoContentResponse({ description: 'Produto excluído.' })
  @ApiConflictResponse({ description: 'O produto já está referenciado por itens de oportunidade.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteProduct.execute(id);
  }
}
