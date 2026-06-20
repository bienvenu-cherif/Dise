import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateWaveMarchandConfigurationDto } from './dto/create-wave-marchand-configuration.dto';
import { UpdateWaveMarchandConfigurationDto } from './dto/update-wave-marchand-configuration.dto';
import { WaveMarchandConfigurationsService } from './wave-marchand-configurations.service';

@Controller('configurations-wave')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'tresorier')
export class WaveMarchandConfigurationsController {
  constructor(private readonly configurationsService: WaveMarchandConfigurationsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateWaveMarchandConfigurationDto) {
    return this.configurationsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query('anneeId') anneeId?: string) {
    return this.configurationsService.findAll(anneeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configurationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWaveMarchandConfigurationDto) {
    return this.configurationsService.update(id, dto);
  }

  @Post(':id/valider')
  valider(@Req() req: any, @Param('id') id: string) {
    return this.configurationsService.valider(id, req.user.id);
  }

  @Post(':id/activer')
  activer(@Req() req: any, @Param('id') id: string) {
    return this.configurationsService.activer(id, req.user.id);
  }

  @Post(':id/desactiver')
  desactiver(@Param('id') id: string) {
    return this.configurationsService.desactiver(id);
  }
}
