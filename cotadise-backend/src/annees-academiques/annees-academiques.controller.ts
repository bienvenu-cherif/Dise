import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnneesAcademiquesService } from './annees-academiques.service';
import { CreateAnneeAcademiqueDto } from './dto/create-annee-academique.dto';
import { UpdateAnneeAcademiqueDto } from './dto/update-annee-academique.dto';

@Controller('annees-academiques')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnneesAcademiquesController {
  constructor(private readonly anneesService: AnneesAcademiquesService) {}

  @Post()
  @Roles('admin', 'tresorier')
  create(@Body() dto: CreateAnneeAcademiqueDto) {
    return this.anneesService.create(dto);
  }

  @Get()
  @Roles('admin', 'tresorier')
  findAll() {
    return this.anneesService.findAll();
  }

  @Get('active')
  @Roles('admin', 'tresorier')
  findActive() {
    return this.anneesService.findActive();
  }

  @Get(':id')
  @Roles('admin', 'tresorier')
  findOne(@Param('id') id: string) {
    return this.anneesService.findOne(id);
  }

  @Get(':id/preparation')
  @Roles('admin', 'tresorier')
  getPreparation(@Param('id') id: string) {
    return this.anneesService.getPreparation(id);
  }

  @Patch(':id')
  @Roles('admin', 'tresorier')
  update(@Param('id') id: string, @Body() dto: UpdateAnneeAcademiqueDto) {
    return this.anneesService.update(id, dto);
  }

  @Post(':id/ouvrir')
  @Roles('admin', 'tresorier')
  ouvrir(@Param('id') id: string) {
    return this.anneesService.ouvrir(id);
  }

  @Post(':id/fermer')
  @Roles('admin', 'tresorier')
  fermer(@Param('id') id: string) {
    return this.anneesService.fermer(id);
  }
}
