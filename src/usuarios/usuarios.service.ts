import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
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
  //USADO
  // OBTIENE CURSOS RELACIONADOS AL USUARIO SEGÚN SU ROL
  async getCursosPorUsuario(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { rol: true, id: true, adscripcionId: true }
    });

    if (!usuario) throw new NotFoundException(`Usuario con ID ${userId} no existe`);

    const anioActual = new Date().getFullYear();
    const inicioAnio = new Date(`${anioActual}-01-01T00:00:00.000Z`);
    const finAnio = new Date(`${anioActual}-12-31T23:59:59.999Z`);
    // --- CASO 1: ADMIN (Todos los cursos) ---
    if (usuario.rol === Role.ADMIN) {
      return this.prisma.curso.findMany({
        include: { 
          instructor: true, 
          creador: true,
          empleados: {
            include: { usuario: true }
          },
          adscripciones: {
              include: { adscripcion: true}
            } 
          }
      });
    }
    // --- CASO 2: INSTRUCTOR ---
    if (usuario.rol === Role.INSTRUCTOR) {
      return this.prisma.curso.findMany({
        where: {
          instructorId: usuario.id,
          estado: { in: ['EN_CURSO', 'POR_INSCRIBIR', 'FINALIZADO'] }
        },
        include: { 
          instructor: true,
          empleados: {
            include: { usuario: true }
          },
          asistencias: {
            include: { usuario: true }
          },
          adscripciones: {
            include: {adscripcion: true}
          } 
        }
      });
    }
    // --- CASO 3, 4 y 5: EMPLEADO ---
    if (usuario.rol === Role.EMPLEADO) {
      return {
        // 3. Cursos a los que está inscrito (Relación CursoEmpleado)
        inscritos: await this.prisma.curso.findMany({
          where: {
            empleados: { some: { usuarioId: usuario.id } },
            estado: { in: ['EN_CURSO', 'POR_INSCRIBIR', 'FINALIZADO'] }
          },
          include: { 
            instructor: true,
            adscripciones: {
              include: {
                adscripcion: true
              }
            } 
          }
        }),

        // 4. Cursos disponibles por inscribir
        disponibles: await this.prisma.curso.findMany({
          where: {
            estado: 'POR_INSCRIBIR',
            tipo: 'INTERNO',
            empleados: { none: { usuarioId: usuario.id } },
            adscripciones: { some: { adscripcionId: usuario.adscripcionId } }
          },
          include: { 
            instructor: true,
            adscripciones: {
              include: {
                adscripcion: true
              }
            },
            empleados: {
              include: { usuario: true }
            },
          },
        }),

        // 5. Historial (Llevó o está llevando en el año actual)
        historialAnual: await this.prisma.curso.findMany({
          where: {
            empleados: { some: { usuarioId: usuario.id } },
            fechaFin: { gte: inicioAnio, lte: finAnio }
          },
          include: { 
            instructor: true, 
            adscripciones: {
              include: {
                adscripcion: true
              }
            } 
          }
        })
      };
    }
  }
  //Traer por adscripción
  findByAdscripcion(adscripcionId: number) {
    return this.prisma.usuario.findMany({
      where: { adscripcionId },
      include: { adscripcion: true },
    });
  }
  //USADO
  //Update password
  async updatePassword(id: number, passActual: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const isMatch = bcrypt.compareSync(passActual, usuario.contrasena);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    return this.prisma.usuario.update({
      where: { id },
      data: { contrasena: hashed },
    });
  }
  //traer por rol
  findByRol(rol: Role) {
    return this.prisma.usuario.findMany({
      where: { rol },
      include: { adscripcion: true },
    });
  }
}