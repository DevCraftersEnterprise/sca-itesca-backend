import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { Modalidad, CursoTipo, CursoEstado } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCursoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the course',
    example: 'Introduction to Programming',
  })
  nombre!: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Description of the course',
    example: 'This course covers the basics of programming using Python.',
  })
  descripcion?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Duration of the course in hours',
    example: 40,
  })
  duracionHrs!: number;

  @IsEnum(Modalidad)
  @ApiProperty({
    description: 'Mode of the course',
    example: Modalidad.PRESENCIAL,
  })
  modalidad!: Modalidad;

  @IsDateString()
  @ApiProperty({
    description: 'Start date of the course',
    example: '2023-10-01',
  })
  fechaInicio!: string;

  @IsDateString()
  @ApiProperty({
    description: 'End date of the course',
    example: '2023-10-31',
  })
  fechaFin!: string;

  @IsString()
  @ApiProperty({
    description: 'Start time of the course (HH:mm format)',
    example: '09:00',
  })
  horaInicio!: string;

  @IsString()
  @ApiProperty({
    description: 'End time of the course (HH:mm format)',
    example: '17:00',
  })
  horaFin!: string;

  @IsEnum(CursoTipo)
  @ApiProperty({
    description: 'Type of the course',
    example: CursoTipo.EXTERNO,
  })
  tipo!: CursoTipo;

  @IsEnum(CursoEstado)
  @IsOptional()
  @ApiProperty({
    description: 'Status of the course',
    example: CursoEstado.POR_INSCRIBIR,
  })
  estado?: CursoEstado;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Recognition or certification offered upon course completion',
    example: 'Certificate of Completion',
  })
  reconocimiento?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the instructor assigned to the course',
    example: 3,
  })
  instructorId!: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Array of department IDs that the course is associated with',
    example: [1, 2, 5],
  })
  adscripcionesIds!: number[]; // Ejemplo: [1, 2, 5]
}