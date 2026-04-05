import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport'; // <--- Importa esto
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Crear un nuevo usuario (Solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 403, description: 'Prohibido: No tienes permisos de ADMIN.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios devuelta correctamente.' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get('mis-cursos')
  @UseGuards(AuthGuard('jwt'))
  async getMisCursos(@Request() req) {
    // El ID viene del Token JWT
    return this.usuariosService.getCursosPorUsuario(req.user.id);
  }
  @Patch('update-password')
  @UseGuards(AuthGuard('jwt'))
  updatePassword(@Request() req, @Body('newPassword') newPassword: string) {
    return this.usuariosService.updatePassword(req.user.id, newPassword);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }
}
