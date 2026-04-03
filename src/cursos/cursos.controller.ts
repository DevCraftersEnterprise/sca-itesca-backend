import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
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
  // 2. Listar todos los cursos (Solo ADMIN)
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findAll() {
    return this.cursosService.findAll();
  }
  // 3. Inscribirse a un curso (Solo EMPLEADO)
  @Post('inscribir')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Protegemos la ruta
  async inscribir(
    @Body('cursoId') cursoId: number, 
    @Req() req: any // 'req.user' contendrá los datos del JWT
  ) {
    const usuarioId = req.user.id;
    return this.cursosService.inscribir(cursoId, usuarioId);
  }
  // 4. Ver mis inscripciones (Solo EMPLEADO)
  @Get('mis-inscripciones')
  @Roles(Role.EMPLEADO)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async misInscripciones(@Req() req: any) {
    const usuarioId = req.user.id; 
    if (!usuarioId) {
       throw new UnauthorizedException('No se encontró el ID del usuario en el token');
    }

    return this.cursosService.obtenerMisInscripciones(usuarioId);
  }
  // 5. Listar cursos disponibles para inscribirse (Solo EMPLEADO)
  @Get('disponibles')
  @Roles(Role.EMPLEADO)
  @UseGuards(AuthGuard('jwt'))
  async listarDisponibles(@Req() req: any) {
    return this.cursosService.listarDisponibles(req.user.id);
  }
  // 6. Listar cursos que imparto (Solo INSTRUCTOR)
  @Get('mis-cursos')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(AuthGuard('jwt'))
  async listarMisCursos(@Req() req: any) {
    return this.cursosService.listarMisCursos(req.user.id);
  }

  // 7. Ver detalle de un curso al que estoy inscrito (Solo EMPLEADO)
  @Get('mis-constancias')
  @UseGuards(AuthGuard('jwt'))
  async verMisConstancias(@Req() req: any) {
    return this.cursosService.obtenerMisConstancias(req.user.id);
  }
  // 8. Listar mis inscripciones activas (Solo EMPLEADO)
  @Get('mis-inscripciones-activas')
  @UseGuards(AuthGuard('jwt'))
  async listarMisInscripciones(@Req() req: any) {
    return this.cursosService.listarMisInscripciones(req.user.id);
  }
  // 9. Ver detalle de un curso al que estoy inscrito (Solo EMPLEADO)
  @Get('mi-curso/:id')
  @UseGuards(AuthGuard('jwt'))
  async verDetalleCurso(@Param('id') id: string, @Req() req: any) {
    return this.cursosService.verDetalleCurso(+id, req.user.id);
  }
  // 10. Ver detalle de un curso (Solo ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cursosService.findOne(+id);
  }
  // 11. Actualizar curso (Solo ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto) {
    return this.cursosService.update(+id, updateCursoDto);
  }
  // 12. Subir constancia de un curso (Solo EMPLEADO)
  @Patch('subir-constancia/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('archivo')) 
  async subirConstancia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    // 1. Subimos a Cloudinary primero
    const urlCloudinary = await this.cloudinaryService.uploadFile(file);
    // 2. Guardamos esa URL en la base de datos
    return this.cursosService.actualizarConstancia(+id, req.user.id, urlCloudinary);
  }
}
