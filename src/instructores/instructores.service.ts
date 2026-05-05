import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { join } from 'path';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import * as fs from 'fs';
import SVGtoPDF from 'svg-to-pdfkit';
import QRCode from 'qrcode'


@Injectable()
export class InstructoresService {
  constructor(private prisma: PrismaService,private cloudinaryService: CloudinaryService) {}
  // 1. Registrar asistencia del día
  async registrarAsistenciaDia(cursoId: number, usuarioIds: number[], fecha?: string) {
    const fechaAsistencia = fecha ? new Date(fecha) : new Date();
    fechaAsistencia.setHours(0, 0, 0, 0);
    const inicioDia = new Date(fechaAsistencia)
    inicioDia.setHours(0, 0, 0, 0)

    const finDia = new Date(fechaAsistencia)
    finDia.setHours(23, 59, 59, 999)
    console.log("Fecha recibida para registrar asistencia:", fecha);
    console.log("Curso ID:", cursoId);
    console.log("Usuario IDs:", usuarioIds);
    
    const existente = await this.prisma.asistencia.findFirst({
      where: {
        cursoId,
        usuarioId: { in: usuarioIds },
        fecha: fechaAsistencia
      }
    });
    if (existente) {
      throw new NotFoundException('Ya se registró la asistencia para este día');
    }
    const data = usuarioIds.map(usuarioId => ({
      cursoId,
      usuarioId,
      fecha: fechaAsistencia
    }));
    return this.prisma.asistencia.createMany({
      data,
      skipDuplicates: true,
    });
  }
  // 2. Actualizar asistencia de un día específico
  async actualizarAsistencia(id: number, cursoId: number, usuarioId: number, estado: 'ASISTENCIA' | 'JUSTIFICADA' | 'FALTA') {
    const asistencia = await this.prisma.asistencia.findFirst({
      where: {
        cursoId,
        usuarioId,
        id
      }
    });
    if (!asistencia) {
      throw new NotFoundException('No se encontró la asistencia para este día');
    }
    return this.prisma.asistencia.update({
      where: { id: id },
      data: { estado }
    });
  }
  // 3. Calificar a un alumno (APROBADO o REPROBADO)
  async asignarCalificacion(cursoId: number, usuarioId: number, calificacion: 'APROBADO' | 'REPROBADO', id: number) {
    const inscripcion = await this.prisma.cursoEmpleado.findUnique({
      where: { 
        id,
        cursoId, 
        usuarioId 
      },
    });
    if (!inscripcion) {
      throw new NotFoundException('No se encontró la inscripción del alumno en el curso');
    }
    return this.prisma.cursoEmpleado.update({
      where: { id: id },
      data: { calificacion: calificacion }
    });
  }
  // 4. Generar constancia PDF para un alumno específico
  async generarConstanciaPDF(cursoId: number, usuarioId: number, res: Response, tipo: 'constancia' | 'reconocimiento'): Promise<void> {
    try {

      const mm = (v: number) => v * 2.83465;
      const doc = new PDFDocument({ size: 'LETTER', margin: 0 });
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const curso = await this.prisma.curso.findUnique({
          where: { id: cursoId },
          include: {
            instructor: true,
          }
        });
      const inscripcion = await this.prisma.cursoEmpleado.findUnique({
        where: { cursoId_usuarioId: { cursoId, usuarioId } },
        include: { 
          usuario: true, 
          curso: true 
        }
      });
      if (!curso) {
        throw new NotFoundException('Curso no encontrado');
      }
      if (!inscripcion) {
        throw new Error(`No se encontró la inscripción para el alumno ${usuarioId} en el curso ${cursoId}`);
      }
      if (tipo === 'reconocimiento') {
        if (curso.reconocimiento){
          res.status(200).json({ url: curso.reconocimiento });
          return;
        }
      } else {
        if (inscripcion.constancia) {
          res.status(200).json({ url: inscripcion.constancia });
          return;
        }
      }

      const pdfBuffer: Buffer = await new Promise(async (resolve, reject) => {
        const chunks: any[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // --- DISEÑO DEL PDF (Dentro de la promesa) ---
        const rutaAssets = join(process.cwd(), 'src/public/assets/certificados');

        try {
          // Fondo total
          const fondo = fs.readFileSync(join(rutaAssets, 'fondo.svg'), 'utf8');
          SVGtoPDF(doc, fondo, 0, 0, { width: pageWidth/4, height: pageHeight, preserveAspectRatio: 'none' });
          
          // Logo Institución
          doc.image(join(rutaAssets, 'logo.png'), (pageWidth - mm(80)) / 2, mm(12), { width: mm(80), height: mm(25) });
          
          // Titulo Institución y texto inicial
          doc.fillColor('#000000');
          doc.font('Helvetica').fontSize(14).text("El Instituto Tecnológico Superior de Cajeme", 0, mm(51), { align: 'center', width: pageWidth });
          const articulo = tipo === 'reconocimiento' ? 'el presente' : 'la presente';
          doc.text(`otorga ${articulo}`, 0, mm(60), { align: 'center', width: pageWidth });
          doc.text("a:", 0, mm(92), { align: 'center', width: pageWidth });
          
          // Formateamos la fecha del curso
          const fechacurso = new Date(inscripcion.curso.fechaFin);
          const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }).format(fechacurso);

          //Margen y ancho para textos largos
          const margenManual = mm(23); // Un margen de 20mm a cada lado
          const anchoUtilizable = pageWidth - (margenManual * 2);

          if (tipo === 'reconocimiento') {
            // Título Reconocimiento
            const rec = fs.readFileSync(join(rutaAssets, 'reconocimiento.svg'), 'utf8');
            SVGtoPDF(doc, rec, 
                (pageWidth - mm(147.1)) / 2 + mm(2), mm(68), 
                { width: mm(147.1), height: mm(15.41), preserveAspectRatio: 'none' });

            // DESCRIPCIÓN
            const texto = `Realizado el ${fechaFormateada}, del presente año en las instalaciones de esta casa de estudios, su contribución enriquese significativamente al desarrollo profesional del personal educativo y promueve la actualización continua en beneficio de nuestra comunidad académica.`;
            doc.font('Helvetica').fontSize(14);
            doc.text("Por su valiosa participación en el Curso de capacitación interno:", 0, mm(123), { align: 'center', width: pageWidth });
            doc.text(texto, margenManual, mm(150), { align: 'center', width: anchoUtilizable, lineGap: 4 });
            
            // NOMBRE DEL USUARIO
            const nombreUsuario = `${curso.instructor?.nombres} ${curso.instructor?.apellidos}`.toUpperCase();
            doc.font('Times-Bold').fontSize(26)
              .text(nombreUsuario, 0, mm(108), { align: 'center', width: pageWidth });

            // NOMBRE CURSO
            doc.font('Helvetica-Bold').fontSize(14)
            .text(`“${inscripcion.curso.nombre}”`, 0, mm(136), { align: 'center', width: pageWidth });

          } else {
            // Título Constancia
            const cons = fs.readFileSync(join(rutaAssets, 'constancia_titulo.svg'), 'utf8');
            SVGtoPDF(doc, cons, 
                (pageWidth - mm(108.2)) / 2 + mm(2), mm(68), 
                { width: mm(108.2), height: mm(15.31), preserveAspectRatio: 'none' });
            // DESCRIPCIÓN
            const texto= `Por su destacada participación en el Curso de capacitación interno realizado el ${fechaFormateada}, en las instalaciones de esta casa de estudios, donde presentó la capacitación del curso:`;
            doc.font('Helvetica').fontSize(14);
            doc.text(texto, margenManual, mm(123), { align: 'center', width: anchoUtilizable, lineGap: 3 });

            // NOMBRE DEL USUARIO
            const nombreUsuario = `${inscripcion.usuario.nombres} ${inscripcion.usuario.apellidos}`.toUpperCase();
            doc.font('Times-Bold').fontSize(26)
              .text(nombreUsuario, 0, mm(108), { align: 'center', width: pageWidth });

            // NOMBRE CURSO
            doc.font('Helvetica-Bold').fontSize(14)
              .text(`“${inscripcion.curso.nombre}”`, 0, mm(148), { align: 'center', width: pageWidth });
            
            const reco = "Reconocemos su dedicación, determinación y compromiso con la finalización del curso establecido por la institución.";
            doc.font('Helvetica').fontSize(14)
              .text(reco, margenManual, mm(161), { align: 'center', width: anchoUtilizable, lineGap: 3 });

          }

          // Logos inferiores
          const sep = fs.readFileSync(join(rutaAssets, 'sep1.svg'), 'utf8');
          SVGtoPDF(doc, sep, mm(59), mm(256), { width: mm(34), height: mm(8) });

          const tecnm = fs.readFileSync(join(rutaAssets, 'tecnmlogo.svg'), 'utf8');
          SVGtoPDF(doc, tecnm, mm(97), mm(255), { width: mm(18.11), height: mm(9.21) });

          const sonora = fs.readFileSync(join(rutaAssets, 'sonoraoprlogo.svg'), 'utf8');
          SVGtoPDF(doc, sonora, mm(120.5), mm(253.8), { width: mm(40.61), height: mm(10.21) });

          // FIRMAS
          const lineafirma = '______________________________';
          doc.fontSize(15).text(lineafirma, 0, mm(205), { align: 'center', width: pageWidth });
          doc.fontSize(15).text("Lic. Margarita Vélez de la Rocha", 0, mm(213), { align: 'center', width: pageWidth });
          doc.fontSize(12).text("Directora General", 0, mm(225), { align: 'center', width: pageWidth });

          // CIUDAD Y FECHA
          const ano = new Date().getFullYear();
          const mes = new Date().toLocaleString('default', { month: 'long' });
          doc.fontSize(14).text(`Cd. Obregón, Sonora, a ${mes} de ${ano}`, 0, mm(245), { align: 'center', width: pageWidth });
          
          const urlVerificacion = `https://google.com`;
          const qrBuffer = await QRCode.toBuffer(urlVerificacion);
          doc.image(qrBuffer, mm(160), mm(180), { width: mm(40), height: mm(40) });
          
          doc.end();
        } catch (err) {
          reject(err);
        }
      });
        
      const limpiar = (texto: string) =>
        texto
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_")
          .replace(/[^\w\-]/g, "");

      const nombreArchivo = `${limpiar(inscripcion.curso.nombre)}_${limpiar(inscripcion.usuario.nombres)}_${limpiar(inscripcion.usuario.apellidos)}`;
      
      const fileMock = {
        buffer: pdfBuffer,
        originalname: nombreArchivo,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const urlCloudinary = await this.cloudinaryService.uploadFile(fileMock, nombreArchivo);
      if (tipo === 'reconocimiento') {
        await this.prisma.curso.update({
          where: { id: cursoId },
          data: { reconocimiento: urlCloudinary }
        });
      } else {
        await this.prisma.cursoEmpleado.update({
          where: { cursoId_usuarioId: { cursoId, usuarioId } },
          data: { 
            constancia: urlCloudinary,
            fechaSubida: new Date(),
           }
        });
      }
      res.status(201).json({ url: urlCloudinary });
      return;
        
    } catch (error : any) {
      console.error("LOG DEL ERROR REAL:", error.message || error);
      if (res.headersSent) {
        return;
      }
      res.status(500).json({ 
        message: 'Error al subir a Cloudinary o guardar en DB', 
        detalle: error.message || "Error interno del servidor" 
      });
      return;
    }
  }
}
