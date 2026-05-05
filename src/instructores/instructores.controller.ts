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
  // 3. Calificar a un alumno (APROBADO o REPROBADO)
  @Patch('calificar')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async calificar(
    @Body('id') id: number,
    @Body('cursoId') cursoId: number,
    @Body('usuarioId') usuarioId: number,
    @Body('calificacion') calificacion: 'APROBADO' | 'REPROBADO'
  ) {
    return this.instructoresService.asignarCalificacion(
      cursoId, 
      usuarioId,
      calificacion, 
      id
    );
  }
  // 3. Generar constancia PDF para un alumno específico
  @Get(':cursoId/:usuarioId')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async generarConstancia(
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body('tipo') tipo: 'reconocimiento' | 'constancia',
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.instructoresService.generarConstanciaPDF(
      cursoId,
      usuarioId,
      res,
      tipo
    );
  }


}