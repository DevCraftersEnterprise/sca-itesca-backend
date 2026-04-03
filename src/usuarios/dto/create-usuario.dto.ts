import { 
    IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El username es obligatorio' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @IsEmail({}, { message: 'El correo debe ser un email válido' })
  correo: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;

  @IsNotEmpty()
  @IsEnum(Role, { message: 'role must be a valid UserRoles value' })
  rol: Role;

  @IsString()
  puesto: string;

  @IsInt({ message: 'El adscripcionId debe ser un número entero' })
  @IsNotEmpty()
  adscripcionId: number;
}