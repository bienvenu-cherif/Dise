import { PartialType } from '@nestjs/mapped-types';
import { CreateCotisationDto } from './create-cotisation.dto';

export class UpdateCotisationDto extends PartialType(CreateCotisationDto) {}
