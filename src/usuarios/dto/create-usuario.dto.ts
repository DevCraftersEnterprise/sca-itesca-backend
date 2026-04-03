import { 
    IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El username es obligatorio' })
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe123',
  })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  nombres!: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  apellidos!: string;

  @IsEmail({}, { message: 'El correo debe ser un email válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com'
  })
  correo!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @ApiProperty({
    description: 'Password for the user (min 6 characters)',
    example: 'securePassword123'
  })
  contrasena!: string;

  @IsNotEmpty()
  @IsEnum(Role, { message: 'role must be a valid UserRoles value' })
  @ApiProperty({
    description: 'Role of the user (ADMIN, EMPLEADO, INSTRUCTOR)',
    example: 'EMPLEADO',
    enum: Role,
  })
  rol!: Role;

  @IsString()
  @IsNotEmpty({ message: 'El puesto es obligatorio' })
  @ApiProperty({
    description: 'Job position of the user',
    example: 'Software Developer',
  })
  puesto!: string;

  @IsInt({ message: 'El adscripcionId debe ser un número entero' })
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the department the user belongs to',
    example: 1,
  })
  adscripcionId!: number;
}