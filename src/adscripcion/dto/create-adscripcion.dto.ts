import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { IsNotEmpty } from "class-validator/types/decorator/common/IsNotEmpty";
import { IsString } from "class-validator/types/decorator/typechecker/IsString";

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