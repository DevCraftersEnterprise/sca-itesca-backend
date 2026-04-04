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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adscripcionService.findOne(+id);
  }
  @Get('clave/:clave')
  findByClave(@Param('clave') clave: string) {
    return this.adscripcionService.findByClave(clave);
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
