import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMontantCotisationDto } from './dto/create-montant-cotisation.dto';
import { UpdateMontantCotisationDto } from './dto/update-montant-cotisation.dto';
import { MontantsCotisationService } from './montants-cotisation.service';

@Controller('montants-cotisation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'tresorier')
export class MontantsCotisationController {
  constructor(private readonly montantsService: MontantsCotisationService) {}

  @Post()
  create(@Body() dto: CreateMontantCotisationDto) {
    return this.montantsService.create(dto);
  }

  @Get()
  findAll() {
    return this.montantsService.findAll();
  }

  @Get('annee/:anneeId')
  findByYear(@Param('anneeId') anneeId: string) {
    return this.montantsService.findByYear(anneeId);
  }

  @Get('resoudre/:anneeId/:userId')
  resoudreMontant(@Param('anneeId') anneeId: string, @Param('userId') userId: string) {
    return this.montantsService.resoudreMontant(userId, anneeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.montantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMontantCotisationDto) {
    return this.montantsService.update(id, dto);
  }
}
