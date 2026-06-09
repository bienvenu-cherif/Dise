import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
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
  @Roles('admin')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('me')
  async getMySummary(@Req() req: any) {
    return this.dashboardService.getStudentSummary(req.user.id);
  }

  @Get('rankings/me')
  async getMyRanking(@Req() req: any) {
    return this.dashboardService.getUserRanking(req.user.id);
  }

  @Get('rankings')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getRankings() {
    return this.dashboardService.getRankings();
  }

  @Get('rankings/level/:levelId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getRankingsByLevel(@Param('levelId') levelId: string) {
    return this.dashboardService.getRankings(levelId);
  }
  @Get('overdue')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getOverdueCotisations() {
    return this.dashboardService.getOverdueCotisations();
  }

  @Get('overdue/export')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async exportOverdueCotisations(@Res({ passthrough: true }) res: Response) {
    const buffer = await this.dashboardService.generateOverdueExport();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="overdue-cotisations.xlsx"');
    return buffer;
  }

  @Get('overdue/level/:levelId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getOverdueCotisationsByLevel(@Param('levelId') levelId: string) {
    return this.dashboardService.getOverdueCotisations(levelId);
  }

  @Get('overdue/level/:levelId/export')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async exportOverdueCotisationsByLevel(
    @Param('levelId') levelId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.dashboardService.generateOverdueExport(levelId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="overdue-cotisations-${levelId}.xlsx"`);
    return buffer;
  }

  @Get('levels')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getLevelSummaries() {
    return this.dashboardService.getLevelSummaries();
  }

  @Get('levels/:levelId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getLevelSummary(@Param('levelId') levelId: string) {
    return this.dashboardService.getLevelSummary(levelId);
  }
}
