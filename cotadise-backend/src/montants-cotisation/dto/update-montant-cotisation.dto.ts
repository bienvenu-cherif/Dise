import { PartialType } from '@nestjs/mapped-types';
import { CreateMontantCotisationDto } from './create-montant-cotisation.dto';

export class UpdateMontantCotisationDto extends PartialType(CreateMontantCotisationDto) {}
