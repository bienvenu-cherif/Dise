import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivateInvitedUserDto } from './dto/activate-invited-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'tresorier')
  findAll() {
    return this.usersService.findAll();
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
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
