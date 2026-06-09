import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CotisationsService } from './cotisations.service';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { UpdateCotisationDto } from './dto/update-cotisation.dto';

@Controller('cotisations')
@UseGuards(JwtAuthGuard)
export class CotisationsController {
  constructor(private readonly cotisationsService: CotisationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() createCotisationDto: CreateCotisationDto) {
    return this.cotisationsService.create(createCotisationDto);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async exportAll(
    @Query('userId') userId: string,
    @Query('status') status: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.cotisationsService.generateExport(userId, status);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cotisations${userId ? `-${userId}` : ''}${status ? `-${status}` : ''}.xlsx"`);
    return buffer;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.cotisationsService.findAll();
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

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.cotisationsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCotisationDto: UpdateCotisationDto) {
    return this.cotisationsService.update(id, updateCotisationDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.cotisationsService.remove(id);
  }
}
