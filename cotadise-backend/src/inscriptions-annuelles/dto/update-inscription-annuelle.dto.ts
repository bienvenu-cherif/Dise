import { PartialType } from '@nestjs/mapped-types';
import { CreateInscriptionAnnuelleDto } from './create-inscription-annuelle.dto';

export class UpdateInscriptionAnnuelleDto extends PartialType(CreateInscriptionAnnuelleDto) {}
