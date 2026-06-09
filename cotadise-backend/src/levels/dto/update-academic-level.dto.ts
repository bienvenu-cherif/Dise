import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicLevelDto } from './create-academic-level.dto';

export class UpdateAcademicLevelDto extends PartialType(CreateAcademicLevelDto) {}
