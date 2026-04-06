import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { join } from 'path';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import * as fs from 'fs'; // Necesario para leer el archivo SVG
const SVGtoPDF = require('svg-to-pdfkit');

@Injectable()
export class InstructoresService {
  constructor(private prisma: PrismaService,
              private cloudinaryService: CloudinaryService
  ) {}


  // 2. Registrar asistencia del DÍA ACTUAL (o cualquier fecha)
  // Este método es un "Upsert": si ya existe, lo cambia; si no, lo crea.
  async registrarAsistenciaDia(cursoId: number, usuarioId: number, estado: any, fecha?: string) {
    // Si no mandan fecha, usamos "Hoy" a las 00:00:00
    const fechaAsistencia = fecha ? new Date(fecha) : new Date();
    fechaAsistencia.setHours(0, 0, 0, 0);

    // Buscamos si ya se marcó asistencia para este alumno en este curso este día
    const existente = await this.prisma.asistencia.findFirst({
      where: {
        cursoId,
        usuarioId,
        fecha: fechaAsistencia
      }
    });

    if (existente) {
      return this.prisma.asistencia.update({
        where: { id: existente.id },
        data: { estado }
      });
    }

    return this.prisma.asistencia.create({
      data: {
        cursoId,
        usuarioId,
        fecha: fechaAsistencia,
        estado
      }
    });
  }

  // ASIGNAR CALIFICACIÓN (APROBADO / REPROBADO)
  async asignarCalificacion(cursoId: number, usuarioId: number, calificacion: 'APROBADO' | 'REPROBADO') {
    return this.prisma.cursoEmpleado.update({
      where: {
        cursoId_usuarioId: { 
          cursoId: cursoId, 
          usuarioId: usuarioId 
        }
      },
      data: {
        calificacion: calificacion,
        estado: calificacion === 'APROBADO' ? 'VALIDADO' : 'POR_VALIDAR'
      }
    });
  }
  
  // 1. Complemento para ver el reconocimiento del instructor
  async verReconocimientoInstructor(cursoId: number, instructorId: number) {
    const curso = await this.prisma.curso.findFirst({
      where: { id: cursoId, instructorId: instructorId },
      select: { reconocimiento: true } // Asegúrate que el campo se llame así
    });
    if (!curso?.reconocimiento) throw new NotFoundException('No hay reconocimiento disponible');
    return { url: curso.reconocimiento };
  }

  // 2. Obtener todos los PDFs aprobados (para descarga masiva)
  async obtenerTodasLasConstancias(cursoId: number) {
    const aprobados = await this.prisma.cursoEmpleado.findMany({
      where: { cursoId, estado: 'VALIDADO' },
      select: { constancia: true } // El campo donde guardas el link al PDF
    });
    
    // Devolvemos solo los links que no sean nulos
    return aprobados.map(a => a.constancia).filter(url => url !== null);
  }

  // Generar data para reporte de asistencia (CSV/Excel)
  async reporteAsistencia(cursoId: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        empleados: {
          include: {
            usuario: {
              select: {
                nombres: true,
                asistencias: { where: { cursoId }, orderBy: { fecha: 'asc' } }
              }
            }
          }
        }
      }
    });

    if (!curso) throw new NotFoundException('Curso no encontrado');

    // Formateamos para que el Excel sea fácil de leer: Nombre | Fecha 1 | Fecha 2...
    return curso.empleados.map(emp => ({
      empleado: emp.usuario.nombres,
      asistencias: emp.usuario.asistencias.map(a => `${a.fecha.toLocaleDateString()}: ${a.estado}`)
    }));
  }
  
  async generarConstanciaPDF(cursoId: number, usuarioId: number, res: Response) {
    // 1. Buscamos la inscripción con todos los datos necesarios
    const inscripcion = await this.prisma.cursoEmpleado.findUnique({
      where: { cursoId_usuarioId: { cursoId, usuarioId } },
      include: { usuario: true, curso: true }
    });

    // Validación de seguridad
    if (!inscripcion) {
      throw new Error(`No se encontró la inscripción para el alumno ${usuarioId} en el curso ${cursoId}`);
    }

    // 2. Si ya tiene una constancia guardada (URL de Cloudinary), redirigimos y terminamos
    

    // 3. Si no existe, preparamos la generación del PDF en MEMORIA
    const mm = (v: number) => v * 2.83465;
    const doc = new PDFDocument({ size: 'LETTER', margin: 0 });
    const pageWidth = 612;
    const chunks: any[] = [];

    // Capturamos los datos en un Buffer en lugar de enviarlos directo al 'res'
    doc.on('data', (chunk) => chunks.push(chunk));

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      
      try {
        // 4. Subimos a Cloudinary usando tu CloudinaryService
        const fileMock = {
          buffer: pdfBuffer,
          originalname: `constancia_${cursoId}_${usuarioId}.pdf`,
          mimetype: 'application/pdf',
        } as Express.Multer.File;

        const urlCloudinary = await this.cloudinaryService.uploadFile(fileMock);

        // 5. Guardamos la URL en la base de datos de Neon
        await this.prisma.cursoEmpleado.update({
          where: { cursoId_usuarioId: { cursoId, usuarioId } },
          data: { constancia: urlCloudinary }
        });

        // 6. Finalmente, enviamos la URL como respuesta o redirigimos
        return res.status(201).json({ url: urlCloudinary });
        
      } catch (error : any) {
        console.error("DETALLE DEL ERROR DE CLOUDINARY:", error); // <--- ESTO ES CLAVE
        return res.status(500).json({ 
          message: 'Error al subir a Cloudinary', 
          detalle: error.message || error 
        });
      }
    });

    // --- DISEÑO DEL PDF (Tu código de assets y textos) ---
    const rutaAssets = join(process.cwd(), 'src/public/assets/certificados');

    try {
      // Fondo total
      const fondo = fs.readFileSync(join(rutaAssets, 'fondo.svg'), 'utf8');
      SVGtoPDF(doc, fondo, 0, 0, { width: 612, height: 792, preserveAspectRatio: 'none' });

      // Título Constancia
      const cons = fs.readFileSync(join(rutaAssets, 'constancia_titulo.svg'), 'utf8');
      SVGtoPDF(doc, cons, (pageWidth - mm(108.2)) / 2 + mm(2), mm(68), { width: mm(108.2), height: mm(15.31) });

      // Logos inferiores
      const sep = fs.readFileSync(join(rutaAssets, 'sep1.svg'), 'utf8');
      SVGtoPDF(doc, sep, mm(59), mm(256), { width: mm(34), height: mm(8) });

      const tecnm = fs.readFileSync(join(rutaAssets, 'tecnmlogo.svg'), 'utf8');
      SVGtoPDF(doc, tecnm, mm(97), mm(255), { width: mm(18.11), height: mm(9.21) });

      const sonora = fs.readFileSync(join(rutaAssets, 'sonoraoprlogo.svg'), 'utf8');
      SVGtoPDF(doc, sonora, mm(120.5), mm(253.8), { width: mm(40.61), height: mm(10.21) });

      // Logo Institución
      doc.image(join(rutaAssets, 'logo.png'), (pageWidth - mm(80)) / 2, mm(12), { width: mm(80), height: mm(25) });
    } catch (err : any) {
      console.error("Error en assets:", err.message);
    }

    // Textos
    doc.fillColor('#000000');
    doc.font('Helvetica').fontSize(14).text("El Instituto Tecnológico Superior de Cajeme", 0, mm(51), { align: 'center', width: pageWidth });
    doc.text("otorga la presente", 0, mm(60), { align: 'center', width: pageWidth });
    doc.text("a:", 0, mm(92), { align: 'center', width: pageWidth });

    const nombreUsuario = `${inscripcion.usuario.nombres} ${inscripcion.usuario.apellidos}`.toUpperCase();
    doc.font('Times-Bold').fontSize(32)
       .text(nombreUsuario, 0, mm(108), { align: 'center', width: pageWidth });

    // DESCRIPCIÓN
    doc.font('Helvetica').fontSize(14);
    doc.text("Por su destacada participación en el Curso de capacitación interno", 0, mm(123), { align: 'center', width: pageWidth });
    doc.text("realizado el 13 de Marzo del 2025, en las instalaciones de esta casa de estudios,", 0, mm(129), { align: 'center', width: pageWidth });
    doc.text("donde presentó la capacitación del curso:", 0, mm(135), { align: 'center', width: pageWidth });

    // NOMBRE CURSO (y: 148mm)
    doc.font('Helvetica-Bold').fontSize(14)
       .text(`“${inscripcion.curso.nombre}”`, 0, mm(148), { align: 'center', width: pageWidth });

    // RECONOCEMOS...
    doc.font('Helvetica').fontSize(14)
       .text("Reconocemos su dedicación, determinación y compromiso con la", 0, mm(161), { align: 'center', width: pageWidth });
    doc.text("finalización del curso establecido por la institución.", 0, mm(168), { align: 'center', width: pageWidth });

    // FIRMAS
    doc.fontSize(15).text("Lic. Margarita Vélez de la Rocha", 0, mm(213), { align: 'center', width: pageWidth });
    doc.fontSize(12).text("Directora General", 0, mm(220), { align: 'center', width: pageWidth });

    // CIUDAD Y FECHA
    doc.fontSize(14).text("Cd. Obregón, Sonora, a Marzo de 2025", 0, mm(245), { align: 'center', width: pageWidth });

    doc.end();
  }
}
