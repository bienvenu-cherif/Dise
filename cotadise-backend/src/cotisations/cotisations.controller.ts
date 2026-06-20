import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CotisationsService } from './cotisations.service';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { GenerateAnnualCotisationsDto } from './dto/generate-annual-cotisations.dto';
import { UpdateCotisationDto } from './dto/update-cotisation.dto';

@Controller('cotisations')
@UseGuards(JwtAuthGuard)
export class CotisationsController {
  constructor(private readonly cotisationsService: CotisationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  create(@Body() createCotisationDto: CreateCotisationDto) {
    return this.cotisationsService.create(createCotisationDto);
  }

  @Post('generer-annuelle')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  generateAnnualCotisations(@Body() dto: GenerateAnnualCotisationsDto) {
    return this.cotisationsService.generateAnnualCotisations(dto);
  }

  @Get('generation-annuelle/previsualiser/:anneeId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  previewAnnualCotisations(@Param('anneeId') anneeId: string) {
    return this.cotisationsService.previewAnnualCotisations(anneeId);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async exportAll(
    @Query('userId') userId: string,
    @Query('status') status: string,
    @Query('anneeId') anneeId: string,
    @Query('levelId') levelId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.cotisationsService.generateExport(userId, status, anneeId, levelId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cotisations${userId ? `-${userId}` : ''}${status ? `-${status}` : ''}.xlsx"`);
    return buffer;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findAll(@Query('anneeId') anneeId?: string, @Query('levelId') levelId?: string, @Query('status') status?: string) {
    return this.cotisationsService.findAll({ anneeAcademiqueId: anneeId, levelId, status });
  }

  @Get('me/export')
  async exportMine(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.cotisationsService.generateExport(req.user.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cotisations-${req.user.id}.xlsx"`);
    return buffer;
  }

  @Get('me')
  findMyCotisations(@Req() req: any) {
    return this.cotisationsService.findForUser(req.user.id);
  }

  @Get('beneficiaire/:userId')
  findBeneficiaryCotisations(@Param('userId') userId: string) {
    return this.cotisationsService.findPayableForBeneficiary(userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findOne(@Param('id') id: string) {
    return this.cotisationsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  update(@Param('id') id: string, @Body() updateCotisationDto: UpdateCotisationDto) {
    return this.cotisationsService.update(id, updateCotisationDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  remove(@Param('id') id: string) {
    return this.cotisationsService.remove(id);
  }
}
