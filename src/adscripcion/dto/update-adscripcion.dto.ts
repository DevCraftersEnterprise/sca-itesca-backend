import { PartialType } from '@nestjs/mapped-types';
import { CreateAdscripcionDto } from './create-adscripcion.dto';

export class UpdateAdscripcionDto extends PartialType(CreateAdscripcionDto) {}
