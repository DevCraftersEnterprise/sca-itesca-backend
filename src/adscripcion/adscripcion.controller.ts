import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdscripcionService } from './adscripcion.service';
import { CreateAdscripcionDto } from './dto/create-adscripcion.dto';
import { UpdateAdscripcionDto } from './dto/update-adscripcion.dto';

@Controller('adscripcion')
export class AdscripcionController {
  constructor(private readonly adscripcionService: AdscripcionService) {}

  @Post()
  create(@Body() createAdscripcionDto: CreateAdscripcionDto) {
    return this.adscripcionService.create(createAdscripcionDto);
  }

  @Get()
  findAll() {
    return this.adscripcionService.findAll();
  }

  @Get(':nombre')
  findOne(@Param('nombre') nombre: string) {
    return this.adscripcionService.findOne(nombre);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdscripcionDto: UpdateAdscripcionDto) {
    return this.adscripcionService.update(+id, updateAdscripcionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adscripcionService.remove(+id);
  }
}
