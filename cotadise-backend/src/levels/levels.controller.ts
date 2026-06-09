import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LevelsService } from './levels.service';
import { CreateAcademicLevelDto } from './dto/create-academic-level.dto';
import { UpdateAcademicLevelDto } from './dto/update-academic-level.dto';
import { GenerateAcademicLevelCotisationsDto } from './dto/generate-academic-level-cotisations.dto';

@Controller('levels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post()
  create(@Body() createAcademicLevelDto: CreateAcademicLevelDto) {
    return this.levelsService.create(createAcademicLevelDto);
  }

  @Get()
  findAll() {
    return this.levelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.levelsService.findOne(id);
  }

  @Post(':id/generate-cotisations')
  generateCotisations(
    @Param('id') id: string,
    @Body() generateAcademicLevelCotisationsDto: GenerateAcademicLevelCotisationsDto,
  ) {
    return this.levelsService.generateCotisationsForLevel(id, generateAcademicLevelCotisationsDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAcademicLevelDto: UpdateAcademicLevelDto) {
    return this.levelsService.update(id, updateAcademicLevelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.levelsService.remove(id);
  }
}
