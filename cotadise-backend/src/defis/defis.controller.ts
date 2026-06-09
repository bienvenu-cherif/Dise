import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateDefiDto } from './dto/create-defi.dto';
import { DefisService } from './defis.service';

@Controller('defis')
@UseGuards(JwtAuthGuard)
export class DefisController {
  constructor(private readonly defisService: DefisService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDefiDto) {
    return this.defisService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findAll() {
    return this.defisService.findAll();
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.defisService.findForUser(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.defisService.findOneForUser(id, req.user.id);
  }

  @Patch(':id/accepter')
  accept(@Req() req: any, @Param('id') id: string) {
    return this.defisService.accept(id, req.user.id);
  }

  @Patch(':id/refuser')
  refuse(@Req() req: any, @Param('id') id: string) {
    return this.defisService.refuse(id, req.user.id);
  }

  @Patch(':id/annuler')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.defisService.cancel(id, req.user.id);
  }
}
