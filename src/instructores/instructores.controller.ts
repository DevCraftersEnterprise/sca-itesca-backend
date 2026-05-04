import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InstructoresService } from './instructores.service';
import express from 'express';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('instructores')
@UseGuards(AuthGuard('jwt'))
export class InstructoresController {
  constructor(private readonly instructoresService: InstructoresService) {}

  // 1. Registrar asistencia del día
  @Post('asistencia-hoy')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async marcarHoy(
    @Body('cursoId') cursoId: number, 
    @Body('usuarioIds') usuarioIds: number[],
    @Body('fecha') fecha?: string
  ) {
    return this.instructoresService.registrarAsistenciaDia(
      cursoId, 
      usuarioIds, 
      fecha
    );
  }

  // 2. Actualizar asistencia de un día específico
  @Patch('asistencia')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async actualizarAsistencia(
    @Body('id') id: number,
    @Body('cursoId') cursoId: number,
    @Body('usuarioId') usuarioId: number,
    @Body('estado') estado: 'ASISTENCIA' | 'JUSTIFICADA' | 'FALTA'
  ) {
    return this.instructoresService.actualizarAsistencia(
      id,
      cursoId,
      usuarioId,
      estado
    );
  }



  // Patch para calificar: APROBADO o REPROBADO
  @Patch('calificar')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async calificar(
    @Body() data: { cursoId: number, usuarioId: number, calificacion: 'APROBADO' | 'REPROBADO' }
  ) {
    return this.instructoresService.asignarCalificacion(data.cursoId, data.usuarioId, data.calificacion);
  }

  // 2. Obtener la lista de enlaces de todas las constancias de los alumnos aprobados
  @Get('curso/:id/constancias-alumnos')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async obtenerConstanciasAlumnos(@Param('id') id: string) {
    return this.instructoresService.obtenerTodasLasConstancias(+id);
  }
  @Get('curso/:id/reporte-asistencia')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async descargarReporte(@Param('id') id: string) {
    return this.instructoresService.reporteAsistencia(+id);
  }
  
  @Get(':cursoId/:usuarioId')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async generarConstancia(
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.instructoresService.generarConstanciaPDF(
      cursoId,
      usuarioId,
      res,
    );
  }

  @Get('descargar-constancia/:cursoId/:usuarioId')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async descargar(
    @Param('cursoId') cursoId: string,
    @Param('usuarioId') usuarioId: string,
    @Res() res: express.Response
  ) {
    return this.instructoresService.generarConstanciaPDF(+cursoId, +usuarioId, res);
  }
}