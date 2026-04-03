import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CursosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCursoDto, creadorId: number) {
    const { adscripcionesIds, ...cursoData } = dto;
    return this.prisma.curso.create({
      data: {
        ...cursoData,
        creadorId: creadorId,
        adscripciones: {
          create: adscripcionesIds?.map((id) => ({
            adscripcionId: id,
          })),
        },
      },
      include: {
        adscripciones: {
          include: { adscripcion: true } // Para que devuelva los nombres de las áreas
        },
        instructor: {
          select: { nombres: true, apellidos: true } // Para confirmar quién es el instructor
        }
      }
    });
  }

  async findAll() {
    return this.prisma.curso.findMany({
      include: {
        instructor: true,
        creador: { select: { username: true } },
        adscripciones: true
      }
    });
  }
  findOne(id: number) {
    return `This action returns a #${id} curso`;
  }

  async update(id: number, dto: UpdateCursoDto) {
    const { adscripcionesIds, ...cursoData } = dto;

    return this.prisma.curso.update({
      where: { id },
      data: {
        ...cursoData,
        adscripciones: adscripcionesIds ? {
          deleteMany: {}, // Borramos las vinculaciones actuales de este curso
          create: adscripcionesIds.map((adscId) => ({
            adscripcionId: adscId,
          })),
        } : undefined,
      },
      include: {
        adscripciones: { include: { adscripcion: true } }
      }
    });
  }

  async inscribir(cursoId: number, usuarioId: number) {
    // 1. Validar si el curso existe
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
    });

    if (!curso) {
      throw new NotFoundException('El curso no existe');
    }

    // 2. Validar si ya está inscrito (Buscamos por la pareja curso-usuario)
    const inscripcionPrevia = await this.prisma.cursoEmpleado.findFirst({
      where: {
        cursoId: cursoId,
        usuarioId: usuarioId,
      },
    });

    if (inscripcionPrevia) {
      throw new BadRequestException('Ya estás inscrito en este curso');
    }

    // 3. Crear la inscripción con los campos de tu modelo
    return this.prisma.cursoEmpleado.create({
      data: {
        cursoId: cursoId,
        usuarioId: usuarioId,
        estado: 'POR_VALIDAR', // Según tu enum ValidacionEstado
        // fechaSubida se pone sola por el @default(now())
      },
    });
  }

  async obtenerMisInscripciones(usuarioId: number) {
    return this.prisma.cursoEmpleado.findMany({
      where: { usuarioId: usuarioId },
      include: {
        curso: true, // Traemos la info del curso (nombre, fecha, etc.)
      },
    });
  }

  async listarDisponibles(usuarioId: number) {
    return this.prisma.curso.findMany({
      where: {
        empleados: {
          none: { usuarioId: usuarioId }
        },
        estado: 'POR_INSCRIBIR' // Solo los que están abiertos
      }
    });
  }

  // Cursos donde el usuario ya tiene un registro
  async listarMisCursos(usuarioId: number) {
    return this.prisma.cursoEmpleado.findMany({
      where: { usuarioId },
      include: { 
        curso: true // Incluye nombre, fechas, tipo (INTERNO/EXTERNO)
      }
    });
  }
  // Ver detalle interno: Estado, Calificación y Constancia
  async verDetalleCurso(inscripcionId: number, usuarioId: number) {
    const detalle = await this.prisma.cursoEmpleado.findFirst({
      where: { id: inscripcionId, usuarioId },
      include: { curso: true }
    });

    if (!detalle) throw new NotFoundException('Inscripción no encontrada');

    // Lógica: Solo mostramos la constancia si el estado es VALIDADO/APROBADO
    return {
      nombreCurso: detalle.curso.nombre,
      estado: detalle.estado,
      calificacion: detalle.calificacion,
      constancia: detalle.estado === 'VALIDADO' ? detalle.constancia : null,
      tipo: detalle.curso.tipo
    };
  }

  // Subir el PDF para que el Admin lo valide después
  async subirConstancia(inscripcionId: number, usuarioId: number, pdfUrl: string) {
    return this.prisma.cursoEmpleado.update({
      where: { id: inscripcionId, usuarioId }, // Seguridad: debe ser su propia inscripción
      data: {
        constancia: pdfUrl,
        estado: 'POR_VALIDAR' // Al subir el PDF, vuelve a revisión
      }
    });
  }

  async actualizarConstancia(inscripcionId: number, usuarioId: number, url: string) {
    // 1. Verificar el estado actual de la inscripción
    const inscripcion = await this.prisma.cursoEmpleado.findFirst({
      where: { id: inscripcionId, usuarioId }
    });

    if (!inscripcion) throw new NotFoundException('No se encontró la inscripción');

    // 2. Regla de oro: No cambiar si ya está validado (opcional, tú decides)
    if (inscripcion.estado === 'VALIDADO') {
      throw new BadRequestException('No puedes cambiar el archivo de un curso ya validado');
    }

    // 3. Actualizar con el nuevo link de Cloudinary
    return this.prisma.cursoEmpleado.update({
      where: { id: inscripcionId },
      data: {
        constancia: url,
        estado: 'POR_VALIDAR', // Regresa a revisión cada que se sube uno nuevo
        fechaSubida: new Date(),
      }
    });
  }

  async listarMisInscripciones(usuarioId: number) {
    return this.prisma.cursoEmpleado.findMany({
      where: { 
        usuarioId: usuarioId 
      },
      include: {
        curso: {
          select: {
            id: true,
            nombre: true,
            fechaInicio: true,
            fechaFin: true,
            modalidad: true,
            tipo: true, // Aquí verás si es INTERNO o EXTERNO
            estado: true // Estado del curso (ej. EN_CURSO, FINALIZADO)
          }
        }
      },
      orderBy: {
        fechaSubida: 'desc' // Los más recientes primero
      }
    });
  }
  
  async obtenerMisConstancias(usuarioId: number) {
    return this.prisma.cursoEmpleado.findMany({
      where: { 
        usuarioId,
        estado: 'VALIDADO', // Solo lo que el Admin ya aprobó
      },
      include: {
        curso: {
          select: { nombre: true, duracionHrs: true, tipo: true }
        }
      }
    });
  }

  async cancelarInscripcion(id: number, usuarioId: number) {
    const inscripcion = await this.prisma.cursoEmpleado.findFirst({
      where: { id, usuarioId },
      include: { curso: true }
    });

    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    // Regla de ITESCA: No se puede cancelar si el curso ya inició
    if (new Date() > new Date(inscripcion.curso.fechaInicio)) {
      throw new BadRequestException('El curso ya inició, no puedes cancelar la inscripción');
    }

    return this.prisma.cursoEmpleado.delete({
      where: { id }
    });
  }

  remove(id: number) {
    return `This action removes a #${id} curso`;
  }
}
