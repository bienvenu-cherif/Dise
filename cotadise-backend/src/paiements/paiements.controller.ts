import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { InitiateWavePaiementDto } from './dto/initiate-wave-paiement.dto';
import { UpdatePaiementDto } from './dto/update-paiement.dto';
import { WaveWebhookDto } from './dto/wave-webhook.dto';
import { WavePaiementsService } from './wave-paiements.service';

@Controller('paiements')
@UseGuards(JwtAuthGuard)
export class PaiementsController {
  constructor(
    private readonly paiementsService: PaiementsService,
    private readonly wavePaiementsService: WavePaiementsService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() createPaiementDto: CreatePaiementDto) {
    const isGestionnaire = req.user.role === 'admin' || req.user.role === 'tresorier';
    if (!createPaiementDto.userId) {
      createPaiementDto.userId = req.user.id;
    }
    if (!isGestionnaire) {
      createPaiementDto.payerId = req.user.id;
      createPaiementDto.origin = createPaiementDto.userId === req.user.id ? 'paiement_personnel' : 'paiement_pour_camarade';
    }
    return this.paiementsService.create(createPaiementDto);
  }

  @Post('main-a-main')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  createMainAMain(@Req() req: any, @Body() createPaiementDto: CreatePaiementDto) {
    createPaiementDto.recordedById = req.user.id;
    createPaiementDto.origin = 'main_a_main';
    createPaiementDto.method = createPaiementDto.method || 'Especes';
    createPaiementDto.status = 'confirme';
    return this.paiementsService.create(createPaiementDto);
  }

  @Post('wave/initier')
  initiateWave(@Req() req: any, @Body() dto: InitiateWavePaiementDto) {
    return this.wavePaiementsService.initiate(req.user.id, dto);
  }

  @Public()
  @Post('wave/webhook')
  handleWaveWebhook(
    @Body() dto: WaveWebhookDto | Record<string, unknown>,
    @Headers('x-wave-signature') waveSignature?: string,
    @Headers('wave-signature') legacyWaveSignature?: string,
  ) {
    return this.wavePaiementsService.handleWebhook(dto, waveSignature ?? legacyWaveSignature);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async exportAll(
    @Query('userId') userId: string,
    @Query('anneeId') anneeId: string,
    @Query('levelId') levelId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.paiementsService.generateExport(userId, anneeId, levelId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="paiements${userId ? `-${userId}` : ''}.xlsx"`);
    return buffer;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findAll(@Query('anneeId') anneeId?: string, @Query('levelId') levelId?: string) {
    return this.paiementsService.findAll({ anneeAcademiqueId: anneeId, levelId });
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
  @Roles('admin', 'tresorier')
  findOne(@Param('id') id: string) {
    return this.paiementsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  update(@Param('id') id: string, @Body() updatePaiementDto: UpdatePaiementDto) {
    return this.paiementsService.update(id, updatePaiementDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  remove(@Param('id') id: string) {
    return this.paiementsService.remove(id);
  }
}
