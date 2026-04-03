import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  // CREAR: Con encriptación de contraseña
  async create(dto: CreateUsuarioDto) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(dto.contrasena, salt);

    return this.prisma.usuario.create({
      data: {

        ...dto,
        contrasena: hashed,
      },
    });
  }

  // TRAER TODOS: Incluimos la adscripción para ver el nombre del departamento
  findAll() {
    return this.prisma.usuario.findMany({
      include: { adscripcion: true },
    });
  }
  // Dentro de la clase UsuariosService
  async findByEmail(correo: string) {
    return this.prisma.usuario.findUnique({
      where: { correo },
      // Opcional: puedes incluir la adscripción si quieres que el token la lleve
      include: { adscripcion: true } 
    });
  }
  // TRAER UNO: Por ID
  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { adscripcion: true },
    });
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no existe`);
    return usuario;
  }

  // ACTUALIZAR: Manejando la contraseña opcional
  async update(id: number, dto: UpdateUsuarioDto) {
    const data = { ...dto };

    // Si el usuario mandó una nueva contraseña, hay que encriptarla
    if (dto.contrasena) {
      const salt = await bcrypt.genSalt(10);
      data.contrasena = await bcrypt.hash(dto.contrasena, salt);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
    });
  }

  // ELIMINAR
  remove(id: number) {
    return this.prisma.usuario.delete({
      where: { id },
    });
  }
}