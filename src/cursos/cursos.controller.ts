import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UnauthorizedException, ParseIntPipe } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport'; // <--- Importa esto
import { Roles } from '../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service'; // Ajusta la ruta si es necesario
import 'multer';
@Controller('cursos')
export class CursosController {
  constructor(
    private readonly cursosService: CursosService,
    private readonly cloudinaryService: CloudinaryService
  ) {}
  // 1. Crear curso (Solo ADMIN)
  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createCursoDto: CreateCursoDto, @Req() req: any) {
    const adminId = req.user.id;
    return this.cursosService.create(createCursoDto, adminId);
  }

  // 2. Inscribirse a un curso (Solo EMPLEADO)
  @Post('inscribir')
  @Roles(Role.EMPLEADO)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async inscribir(
    @Body('cursoId') cursoId: number, 
    @Req() req: any
  ) {
    const usuarioId = req.user.id;
    return this.cursosService.inscribir(cursoId, usuarioId);
  }

  // 3. Ver detalles de un curso (Abierto para todos)
  @Get(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR, Role.EMPLEADO)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getDetalleCurso(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.cursosService.findOne(id, userId);
  }

  // 4. Inscripción masiva a un curso (Solo ADMIN)
  @Post('inscribir-masivo')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async inscribirMasivo(
    @Body('cursoId') cursoId: number, 
    @Body('usuarioIds') usuarioIds: number[]
  ) {
    return this.cursosService.inscribirMasivo(cursoId, usuarioIds);
  }

  // 5. Ver asistencias de un curso (Solo INSTRUCTOR)
  @Get(':id/asistencia')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getAsistenciasCurso(@Param('id', ParseIntPipe) id: number) {
    return this.cursosService.findAsistencias(id);
  }
  
  // 6. Subir constancia de un curso (Solo EMPLEADO)
  @Patch('subir-constancia/:id')
  @Roles(Role.EMPLEADO)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(FileInterceptor('file')) 
  async subirConstancia(
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    const usuarioId = req.user.id;
    return this.cursosService.subirConstancia(usuarioId, cursoId, file);
  }





  // 11. Actualizar curso (Solo ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto) {
    return this.cursosService.update(+id, updateCursoDto);
  }
  
}
