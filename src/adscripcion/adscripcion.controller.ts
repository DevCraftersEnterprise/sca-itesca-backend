import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AdscripcionService } from './adscripcion.service';
import { CreateAdscripcionDto } from './dto/create-adscripcion.dto';
import { UpdateAdscripcionDto } from './dto/update-adscripcion.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport'; 
@Controller('adscripcion')
export class AdscripcionController {
  constructor(private readonly adscripcionService: AdscripcionService) {}
  // 1. Crear adscripción 
  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createAdscripcionDto: CreateAdscripcionDto) {
    return this.adscripcionService.create(createAdscripcionDto);
  }
  // 2. Traer todos
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findAll() {
    return this.adscripcionService.findAll();
  }
  // 3. Traer uno solo - no se usa
  @Get(':nombre')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findOne(@Param('nombre') nombre: string) {
    return this.adscripcionService.findOne(nombre);
  }
  // 4. Actualizar - no se usa
  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() updateAdscripcionDto: UpdateAdscripcionDto) {
    return this.adscripcionService.update(+id, updateAdscripcionDto);
  }
  // 5. Eliminar - no se usa
  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.adscripcionService.remove(+id);
  }
}
