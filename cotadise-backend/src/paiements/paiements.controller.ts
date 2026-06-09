import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';

@Controller('paiements')
@UseGuards(JwtAuthGuard)
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Post()
  create(@Req() req: any, @Body() createPaiementDto: CreatePaiementDto) {
    if (!createPaiementDto.userId || req.user.role !== 'admin') {
      createPaiementDto.userId = req.user.id;
    }
    return this.paiementsService.create(createPaiementDto);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async exportAll(@Query('userId') userId: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.paiementsService.generateExport(userId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="paiements${userId ? `-${userId}` : ''}.xlsx"`);
    return buffer;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.paiementsService.findAll();
  }

  @Get('me/export')
  async exportMine(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.paiementsService.generateExport(req.user.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="paiements-${req.user.id}.xlsx"`);
    return buffer;
  }

  @Get('me')
  findMyPaiements(@Req() req: any) {
    return this.paiementsService.findForUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.paiementsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updatePaiementDto: UpdatePaiementDto) {
    return this.paiementsService.update(id, updatePaiementDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.paiementsService.remove(id);
  }
}
