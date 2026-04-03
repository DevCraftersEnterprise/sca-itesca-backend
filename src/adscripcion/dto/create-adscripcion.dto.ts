import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdscripcionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @ApiProperty({
    description: 'Name of the department',
    example: 'Departamento de Informática',
  })
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'La clave es obligatoria' })
  @ApiProperty({
    description: 'Clave of the department',
    example: 'INF-001',
  })
  clave!: string;
}