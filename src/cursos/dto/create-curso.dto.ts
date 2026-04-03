import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { Modalidad, CursoTipo, CursoEstado } from '@prisma/client';

export class CreateCursoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsNotEmpty()
  duracionHrs: number;

  @IsEnum(Modalidad)
  modalidad: Modalidad;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsEnum(CursoTipo)
  tipo: CursoTipo;

  @IsEnum(CursoEstado)
  @IsOptional()
  estado?: CursoEstado;

  @IsString()
  @IsOptional()
  reconocimiento?: string;

  @IsInt()
  @IsNotEmpty()
  instructorId: number;

  @IsArray()
  @IsInt({ each: true }) // Valida que cada elemento del arreglo sea un número
  @IsOptional()
  adscripcionesIds?: number[]; // Ejemplo: [1, 2, 5]
}