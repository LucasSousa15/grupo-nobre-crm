import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateSellerUseCase } from 'src/modules/sellers/application/use-cases/create-seller.use-case';
import { DeleteSellerUseCase } from 'src/modules/sellers/application/use-cases/delete-seller.use-case';
import { FindSellerUseCase } from 'src/modules/sellers/application/use-cases/find-seller.use-case';
import { UpdateSellerUseCase } from 'src/modules/sellers/application/use-cases/update-seller.use-case';
import { CreateSellerDto } from '../dto/create-seller.dto';
import { UpdateSellerDto } from '../dto/update-seller.dto';
import { SellerViewModel } from '../view-models/seller.view-model';

@ApiTags('Sellers')
@Controller('sellers')
export class SellersController {
  constructor(
    private readonly createSeller: CreateSellerUseCase,
    private readonly findSeller: FindSellerUseCase,
    private readonly updateSeller: UpdateSellerUseCase,
    private readonly deleteSeller: DeleteSellerUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista vendedores' })
  @ApiOkResponse({ description: 'Vendedores encontrados.' })
  async findAll() {
    const sellers = await this.findSeller.all();
    return { sellers: sellers.map(SellerViewModel.toHTTP) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um vendedor por ID' })
  @ApiParam({ name: 'id', description: 'UUID do vendedor' })
  async findById(@Param('id') id: string) {
    return { seller: SellerViewModel.toHTTP(await this.findSeller.byId(id)) };
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um vendedor' })
  @ApiCreatedResponse({ description: 'Vendedor criado.' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  async create(@Body() dto: CreateSellerDto) {
    return { seller: SellerViewModel.toHTTP(await this.createSeller.execute(dto)) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza ou desativa um vendedor' })
  @ApiParam({ name: 'id', description: 'UUID do vendedor' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  async update(@Param('id') id: string, @Body() dto: UpdateSellerDto) {
    return { seller: SellerViewModel.toHTTP(await this.updateSeller.execute(id, dto)) };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui um vendedor sem oportunidades vinculadas' })
  @ApiParam({ name: 'id', description: 'UUID do vendedor' })
  @ApiNoContentResponse({ description: 'Vendedor excluído.' })
  @ApiConflictResponse({ description: 'O vendedor possui oportunidades e deve ser desativado.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteSeller.execute(id);
  }
}
