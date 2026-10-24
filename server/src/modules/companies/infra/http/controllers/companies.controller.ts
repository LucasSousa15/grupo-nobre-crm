import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateCompanyUseCase } from 'src/modules/companies/application/use-cases/create-company.use-case';
import { DeleteCompanyUseCase } from 'src/modules/companies/application/use-cases/delete-company.use-case';
import { FindCompanyUseCase } from 'src/modules/companies/application/use-cases/find-company.use-case';
import { UpdateCompanyUseCase } from 'src/modules/companies/application/use-cases/update-company.use-case';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyViewModel } from '../view-models/company.view-model';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly createCompany: CreateCompanyUseCase,
    private readonly findCompany: FindCompanyUseCase,
    private readonly updateCompany: UpdateCompanyUseCase,
    private readonly deleteCompany: DeleteCompanyUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista empresas' })
  @ApiOkResponse({ description: 'Empresas encontradas.' })
  async findAll() {
    const companies = await this.findCompany.all();
    return { companies: companies.map(CompanyViewModel.toHTTP) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma empresa por ID' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  async findById(@Param('id') id: string) {
    return { company: CompanyViewModel.toHTTP(await this.findCompany.byId(id)) };
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma empresa e seu contato principal' })
  @ApiCreatedResponse({ description: 'Empresa criada.' })
  async create(@Body() dto: CreateCompanyDto) {
    return { company: CompanyViewModel.toHTTP(await this.createCompany.execute(dto)) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma empresa ou seu contato principal' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return { company: CompanyViewModel.toHTTP(await this.updateCompany.execute(id, dto)) };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui uma empresa sem oportunidades vinculadas' })
  @ApiParam({ name: 'id', description: 'UUID da empresa' })
  @ApiNoContentResponse({ description: 'Empresa excluída.' })
  @ApiConflictResponse({ description: 'A empresa possui oportunidades vinculadas.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteCompany.execute(id);
  }
}
