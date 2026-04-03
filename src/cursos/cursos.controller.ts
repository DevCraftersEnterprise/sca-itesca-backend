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

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createCursoDto: CreateCursoDto, @Req() req: any) {
    // Extraemos el ID del admin desde el request (puesto ahí por el JwtStrategy)
    const adminId = req.user.id;
    return this.cursosService.create(createCursoDto, adminId);
  }

  @Get()
  findAll() {
    return this.cursosService.findAll();
  }

  @Post('inscribir')
  @UseGuards(AuthGuard('jwt')) // Protegemos la ruta
  async inscribir(
    @Body('cursoId') cursoId: number, 
    @Req() req: any // 'req.user' contendrá los datos del JWT
  ) {
    const usuarioId = req.user.id;
    return this.cursosService.inscribir(cursoId, usuarioId);
  }

  @Get('mis-inscripciones')
  @UseGuards(AuthGuard('jwt'))
  async misInscripciones(@Req() req: any) {
    // Aquí no pasamos un ID por la URL, usamos el del Token
    const usuarioId = req.user.id; 
    
    if (!usuarioId) {
       throw new UnauthorizedException('No se encontró el ID del usuario en el token');
    }

    return this.cursosService.obtenerMisInscripciones(usuarioId);
  }

  @Get('disponibles')
  @UseGuards(AuthGuard('jwt'))
  async listarDisponibles(@Req() req: any) {
    return this.cursosService.listarDisponibles(req.user.id);
  }

  @Get('mis-cursos')
  @UseGuards(AuthGuard('jwt'))
  async listarMisCursos(@Req() req: any) {
    return this.cursosService.listarMisCursos(req.user.id);
  }

  // 1. Ver solo los cursos que ya están validados (su "Kardex")
  @Get('mis-constancias')
  @UseGuards(AuthGuard('jwt'))
  async verMisConstancias(@Req() req: any) {
    return this.cursosService.obtenerMisConstancias(req.user.id);
  }

  @Get('mis-inscripciones-activas')
  @UseGuards(AuthGuard('jwt'))
  async listarMisInscripciones(@Req() req: any) {
    return this.cursosService.listarMisInscripciones(req.user.id);
  }

  @Get('mi-curso/:id')
  @UseGuards(AuthGuard('jwt'))
  async verDetalleCurso(@Param('id') id: string, @Req() req: any) {
    return this.cursosService.verDetalleCurso(+id, req.user.id);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cursosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto) {
    return this.cursosService.update(+id, updateCursoDto);
  }

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cursosService.remove(+id);
  }

  // 2. Darse de baja de un curso
  @Delete('cancelar-inscripcion/:id')
  @UseGuards(AuthGuard('jwt'))
  async cancelar(@Param('id') id: string, @Req() req: any) {
    return this.cursosService.cancelarInscripcion(+id, req.user.id);
  }
}
