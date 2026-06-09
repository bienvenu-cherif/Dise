import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SendPromotionMessageDto } from './dto/send-promotion-message.dto';
import { AlumniService } from './alumni.service';

@Controller('alumni')
@UseGuards(JwtAuthGuard)
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findAll() {
    return this.alumniService.findAll();
  }

  @Get('promotions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findPromotions() {
    return this.alumniService.findPromotions();
  }

  @Get('promotions/:promotion')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  findPromotion(@Param('promotion') promotion: string) {
    return this.alumniService.findPromotion(promotion);
  }

  @Post('promotions/:promotion/message')
  @UseGuards(RolesGuard)
  @Roles('admin', 'tresorier')
  sendPromotionMessage(@Req() req: any, @Param('promotion') promotion: string, @Body() dto: SendPromotionMessageDto) {
    return this.alumniService.sendPromotionMessage(req.user.id, promotion, dto);
  }
}
