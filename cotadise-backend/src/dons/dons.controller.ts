import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateDonAlumniDto } from './dto/create-don-alumni.dto';
import { DonsService } from './dons.service';

@Controller('dons')
@UseGuards(JwtAuthGuard)
export class DonsController {
  constructor(private readonly donsService: DonsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDonAlumniDto) {
    const isGestionnaire = req.user.role === 'admin' || req.user.role === 'tresorier';
    if (!isGestionnaire) {
      dto.alumniId = req.user.id;
      dto.origin = 'don_wave';
    }
    return this.donsService.create(dto);
  }

  @Post('main-a-main')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  createMainAMain(@Req() req: any, @Body() dto: CreateDonAlumniDto) {
    dto.recordedById = req.user.id;
    dto.origin = 'don_main_a_main';
    dto.method = dto.method || 'Especes';
    dto.status = 'confirme';
    return this.donsService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findAll(@Query('promotion') promotion?: string, @Query('status') status?: string) {
    return this.donsService.findAll({ promotion, status });
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.donsService.findForAlumni(req.user.id);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async exportAll(@Query('promotion') promotion: string, @Query('status') status: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.donsService.generateExport({ promotion, status });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="dons-alumni.xlsx"');
    return buffer;
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findOne(@Param('id') id: string) {
    return this.donsService.findOne(id);
  }
}
