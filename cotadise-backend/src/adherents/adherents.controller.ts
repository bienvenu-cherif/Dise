import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, Query, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdherentsService } from './adherents.service';
import { CreateAdherentDto } from './dto/create-adherent.dto';
import { UpdateAdherentDto } from './dto/update-adherent.dto';

@Controller('adherents')
@UseGuards(JwtAuthGuard)
export class AdherentsController {
  constructor(private readonly adherentsService: AdherentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  create(@Body() createAdherentDto: CreateAdherentDto) {
    return this.adherentsService.create(createAdherentDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findAll() {
    return this.adherentsService.findAll();
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async exportAdherents(@Query('status') status: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.adherentsService.generateExport(status);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="adherents${status ? `-${status}` : ''}.xlsx"`);
    return buffer;
  }

  @Get('me')
  findMyAdherent(@Req() req: any) {
    return this.adherentsService.findByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findOne(@Param('id') id: string) {
    return this.adherentsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  update(@Param('id') id: string, @Body() updateAdherentDto: UpdateAdherentDto) {
    return this.adherentsService.update(id, updateAdherentDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  remove(@Param('id') id: string) {
    return this.adherentsService.remove(id);
  }
}
