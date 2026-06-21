import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivateInvitedUserDto } from './dto/activate-invited-user.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PassationBureauDto } from './dto/passation-bureau.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  @UseInterceptors(FileInterceptor('file'))
  importStudents(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.importFromExcel(file);
  }

  @Get('invites/recherche')
  searchInvitedStudents(@Query('q') query = '') {
    return this.usersService.searchInvitedStudents(query);
  }

  @Post('invites/:id/activer')
  activateInvitedStudent(@Param('id') id: string, @Body() dto: ActivateInvitedUserDto) {
    return this.usersService.activateInvitedStudent(id, dto);
  }

  @Post('invites/:id/regenerer-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  regenerateActivationCode(@Param('id') id: string) {
    return this.usersService.regenerateActivationCode(id);
  }

  @Get('camarades/recherche')
  @UseGuards(JwtAuthGuard)
  searchActiveStudents(@Query('q') query = '', @Query('levelId') levelId = '', @Req() req: any) {
    return this.usersService.searchActiveStudents(query, req.user.id, levelId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Req() req: any, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMyProfile(req.user.id, dto);
  }

  @Put('me/mot-de-passe')
  @UseGuards(JwtAuthGuard)
  changeMyPassword(@Req() req: any, @Body() dto: ChangeMyPasswordDto) {
    return this.usersService.changeMyPassword(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  findAll() {
    return this.usersService.findAll();
  }

  @Post('passation-bureau')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  passationBureau(@Req() req: any, @Body() dto: PassationBureauDto) {
    return this.usersService.passationBureau(dto, req.user.id);
  }

  @Delete('invites/en-attente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  removePendingInvites(@Req() req: any) {
    return this.usersService.removePendingInvites(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.usersService.remove(id, req.user.id);
  }
}
