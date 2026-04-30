import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class CursosService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}
  // 1. Crear curso (Solo ADMIN)
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
          include: { adscripcion: true }
        },
        instructor: {
          select: { nombres: true, apellidos: true }
        }
      }
    });
  }
  // 2. Inscribirse a un curso (Solo EMPLEADO)
  async inscribir(cursoId: number, usuarioId: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
    });
    if (!curso) {
      throw new NotFoundException('El curso no existe');
    }
    const inscripcionPrevia = await this.prisma.cursoEmpleado.findFirst({
      where: {
        cursoId: cursoId,
        usuarioId: usuarioId,
      },
    });
    if (inscripcionPrevia) {
      throw new BadRequestException('Ya estás inscrito en este curso');
    }
    return this.prisma.cursoEmpleado.create({
      data: {
        cursoId: cursoId,
        usuarioId: usuarioId,
      },
    });
  }
  // 3. Ver detalles de un curso (Abierto para todos)
  async findOne(id: number, userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    }); 
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.rol === 'EMPLEADO') {
      return this.prisma.curso.findUnique({
        where: { id },
        include: {
          instructor: true,
          adscripciones: { include: { adscripcion: true } },
          empleados: {
            select: {
              id: true,
            }
          }
        }
      });
    } else if (user.rol === 'INSTRUCTOR') {
      return this.prisma.curso.findUnique({
        where: { id },
        include: {
          instructor: true,
          adscripciones: { include: { adscripcion: true } },
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
    } else {
      return await this.prisma.curso.findUnique({
        where: { id },
        include: {
          instructor: true,
          adscripciones: { include: { adscripcion: true } },
          empleados: {
            include: { 
              usuario: {
                include: {
                  adscripcion: true 
                }
              }
            }
          },
        }
      });
    }
  }
  // 4. Inscripción masiva (Solo ADMIN)
  async inscribirMasivo(cursoId: number, usuarioIds: number[]) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
    });
    if (!curso) {
      throw new NotFoundException('El curso no existe');
    }
    const inscripcionesPrevias = await this.prisma.cursoEmpleado.findMany({
      where: {
        cursoId: cursoId,
        usuarioId: { in: usuarioIds },
      },
    });
    const usuariosYaInscritos = inscripcionesPrevias.map((insc) => insc.usuarioId);
    const nuevosUsuarios = usuarioIds.filter((id) => !usuariosYaInscritos.includes(id));
    const nuevasInscripciones = nuevosUsuarios.map((usuarioId) => ({
      cursoId: cursoId,
      usuarioId: usuarioId,
    }));
    return this.prisma.cursoEmpleado.createMany({
      data: nuevasInscripciones,
      skipDuplicates: true,
    });
  }
  // 5. Subir constancia de un curso (Solo EMPLEADO)
  async subirConstancia(usuarioId: number, cursoId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    const inscripcion = await this.prisma.cursoEmpleado.findFirst({
      where: {
        usuarioId: usuarioId,
        cursoId: cursoId
      }
    });
    if (!inscripcion) {
      throw new BadRequestException('No se encontró la inscripción');
    }
    try {
      const publicId = `comprobante_u${usuarioId}_c${cursoId}`;
      const resultado = await this.cloudinaryService.uploadFile(file, publicId);
      return this.prisma.cursoEmpleado.update({
        where: { id: inscripcion.id, usuarioId }, // Seguridad: debe ser su propia inscripción
        data: {
          constancia: resultado,
          estado: 'POR_VALIDAR',
          fechaSubida: new Date(),
        }
      });
    } catch (error) {
      throw new BadRequestException('Error al subir el archivo a Cloudinary');
    }
    
  }
  // 6. Actualizar curso (Solo ADMIN) - No se ha usado
  async update(id: number, dto: UpdateCursoDto) {
    const { adscripcionesIds, ...cursoData } = dto;
    return this.prisma.curso.update({
      where: { id },
      data: {
        ...cursoData,
        adscripciones: adscripcionesIds ? {
          deleteMany: {}, 
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
  // 7. Tarea programada para actualizar estados de cursos
  @Cron(CronExpression.EVERY_HOUR) 
  async handleCron() {
    const ahora = new Date();
    const DESFASE_SONORA = 7 * 60 * 60 * 1000; 
    const ahoraSonora = new Date(ahora.getTime() - DESFASE_SONORA);
    const inicioHoySonora = new Date(ahoraSonora);
    inicioHoySonora.setHours(0, 0, 0, 0);
    try {
      const iniciados = await this.prisma.curso.updateMany({
        where: {
          fechaInicio: { lte: ahoraSonora },
          fechaFin: { gte: inicioHoySonora },
          estado: 'POR_INSCRIBIR' 
        },
        data: { estado: 'EN_CURSO' },
      });
      const terminados = await this.prisma.curso.updateMany({
        where: {
          fechaFin: { lt: inicioHoySonora }, 
          estado: { not: 'FINALIZADO' },
        },
        data: { estado: 'FINALIZADO' },
      });
      if (iniciados.count > 0 || terminados.count > 0) {
        console.log(
          `Actualización exitosa: ${iniciados.count} iniciados, ${terminados.count} finalizados.`
        );
      }
    } catch (error) {
      throw new BadRequestException('Error al actualizar estados de cursos');
    }
  }
}
