import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AppliquerPassagesDto } from './dto/appliquer-passages.dto';
import { CreateInscriptionAnnuelleDto } from './dto/create-inscription-annuelle.dto';
import { UpdateInscriptionAnnuelleDto } from './dto/update-inscription-annuelle.dto';
import { InscriptionsAnnuellesService } from './inscriptions-annuelles.service';

@Controller('inscriptions-annuelles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'tresorier')
export class InscriptionsAnnuellesController {
  constructor(private readonly inscriptionsService: InscriptionsAnnuellesService) {}

  @Post()
  create(@Body() dto: CreateInscriptionAnnuelleDto) {
    return this.inscriptionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.inscriptionsService.findAll();
  }

  @Get('annee/:anneeId')
  findByYear(@Param('anneeId') anneeId: string) {
    return this.inscriptionsService.findByYear(anneeId);
  }

  @Get('passages/previsualiser/:anneeSourceId')
  previsualiserPassages(@Param('anneeSourceId') anneeSourceId: string) {
    return this.inscriptionsService.previsualiserPassages(anneeSourceId);
  }

  @Post('passages/appliquer')
  appliquerPassages(@Body() dto: AppliquerPassagesDto) {
    return this.inscriptionsService.appliquerPassages(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inscriptionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInscriptionAnnuelleDto) {
    return this.inscriptionsService.update(id, dto);
  }
}
