import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getSummary(@Query('anneeId') anneeId?: string) {
    return this.dashboardService.getSummary(anneeId);
  }

  @Get('me')
  async getMySummary(@Req() req: any, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getStudentSummary(req.user.id, anneeId);
  }

  @Get('me/progression')
  async getMyProgression(@Req() req: any, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getStudentProgression(req.user.id, anneeId);
  }

  @Get('rankings/me')
  async getMyRanking(@Req() req: any, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getUserRanking(req.user.id, anneeId);
  }

  @Get('rankings')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getRankings(@Query('anneeId') anneeId?: string) {
    return this.dashboardService.getRankings(undefined, anneeId);
  }

  @Get('students/:userId/progression')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getStudentProgression(@Param('userId') userId: string, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getStudentProgression(userId, anneeId);
  }

  @Get('rankings/level/:levelId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getRankingsByLevel(@Param('levelId') levelId: string, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getRankings(levelId, anneeId);
  }
  @Get('overdue')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getOverdueCotisations(@Query('anneeId') anneeId?: string) {
    return this.dashboardService.getOverdueCotisations(undefined, anneeId);
  }

  @Get('overdue/export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async exportOverdueCotisations(@Res({ passthrough: true }) res: Response, @Query('anneeId') anneeId?: string) {
    const buffer = await this.dashboardService.generateOverdueExport(undefined, anneeId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="overdue-cotisations.xlsx"');
    return buffer;
  }

  @Get('overdue/level/:levelId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getOverdueCotisationsByLevel(@Param('levelId') levelId: string, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getOverdueCotisations(levelId, anneeId);
  }

  @Get('overdue/level/:levelId/export')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async exportOverdueCotisationsByLevel(
    @Param('levelId') levelId: string,
    @Res({ passthrough: true }) res: Response,
    @Query('anneeId') anneeId?: string,
  ) {
    const buffer = await this.dashboardService.generateOverdueExport(levelId, anneeId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="overdue-cotisations-${levelId}.xlsx"`);
    return buffer;
  }

  @Get('levels')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getLevelSummaries(@Query('anneeId') anneeId?: string) {
    return this.dashboardService.getLevelSummaries(anneeId);
  }

  @Get('levels/:levelId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  async getLevelSummary(@Param('levelId') levelId: string, @Query('anneeId') anneeId?: string) {
    return this.dashboardService.getLevelSummary(levelId, anneeId);
  }
}
