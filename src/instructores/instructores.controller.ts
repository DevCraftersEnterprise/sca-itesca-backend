import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InstructoresService } from './instructores.service';
import express from 'express';

@Controller('instructores')
@UseGuards(AuthGuard('jwt'))
export class InstructoresController {
  constructor(private readonly instructoresService: InstructoresService) {}

  // Cuando el Instructor da clic en "Presente" o "Ausente" hoy:
  @Post('asistencia-hoy')
  async marcarHoy(
    @Body() data: { cursoId: number, usuarioId: number, estado: any, fecha?: string }
  ) {
    // Si 'fecha' viene en el body (ej. "2024-03-15"), registra esa. 
    // Si no viene, el servicio usa la fecha de hoy por defecto.
    return this.instructoresService.registrarAsistenciaDia(
      data.cursoId, 
      data.usuarioId, 
      data.estado, 
      data.fecha
    );
  }
  // Patch para calificar: APROBADO o REPROBADO
  @Patch('calificar')
  async calificar(
    @Body() data: { cursoId: number, usuarioId: number, calificacion: 'APROBADO' | 'REPROBADO' }
  ) {
    return this.instructoresService.asignarCalificacion(data.cursoId, data.usuarioId, data.calificacion);
  }

  // 1. Ver el reconocimiento/diploma del propio instructor
  @Get('curso/:id/mi-reconocimiento')
  async verMiReconocimiento(
    @Param('id') id: string, 
    @Req() req: any
  ) {
    // Usamos el ID del usuario logueado (req.user.id) para validar que sea SU curso
    return this.instructoresService.verReconocimientoInstructor(+id, req.user.id);
  }

  // 2. Obtener la lista de enlaces de todas las constancias de los alumnos aprobados
  @Get('curso/:id/constancias-alumnos')
  async obtenerConstanciasAlumnos(@Param('id') id: string) {
    return this.instructoresService.obtenerTodasLasConstancias(+id);
  }
  @Get('curso/:id/reporte-asistencia')
  async descargarReporte(@Param('id') id: string) {
    return this.instructoresService.reporteAsistencia(+id);
  }

  @Get('descargar-constancia/:cursoId/:usuarioId')
  async descargar(
    @Param('cursoId') cursoId: string,
    @Param('usuarioId') usuarioId: string,
    @Res() res: express.Response
  ) {
    return this.instructoresService.generarConstanciaPDF(+cursoId, +usuarioId, res);
  }
}