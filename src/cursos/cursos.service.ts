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

  async findOne(id: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        instructor: true,
        adscripciones: { include: { adscripcion: true } },
        // Traemos a los empleados inscritos para la vista de "Ver curso"
        empleados: {
          include: { 
            usuario: {
              include: {
                adscripcion: true 
              }
            }
          }
        },
        asistencias: {
          include: { usuario: true }
        },
      }
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    return curso;
  }
  async findAsistencias(id: number) {
    // Solo traemos la lista de alumnos y sus asistencias registradas
    return this.prisma.asistencia.findMany({
      where: { cursoId: id },
      include: {
        usuario: true // Para saber el nombre del alumno
      },
      orderBy: { fecha: 'desc' }
    });
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
      },
    });
  }
  
  async inscribirMasivo(cursoId: number, usuarioIds: number[]) {
    // 1. Validar si el curso existe
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
    });

    if (!curso) {
      throw new NotFoundException('El curso no existe');
    }
    // 2. Filtrar los usuarios que ya están inscritos para evitar errores de duplicado
    const inscripcionesPrevias = await this.prisma.cursoEmpleado.findMany({
      where: {
        cursoId: cursoId,
        usuarioId: { in: usuarioIds },
      },
    });
    const usuariosYaInscritos = inscripcionesPrevias.map((insc) => insc.usuarioId);
    const nuevosUsuarios = usuarioIds.filter((id) => !usuariosYaInscritos.includes(id));
    // 3. Crear las nuevas inscripciones en bloque
    const nuevasInscripciones = nuevosUsuarios.map((usuarioId) => ({
      cursoId: cursoId,
      usuarioId: usuarioId,
    }));
    return this.prisma.cursoEmpleado.createMany({
      data: nuevasInscripciones,
      skipDuplicates: true, // Por seguridad, aunque ya filtramos antes
    });
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

}
