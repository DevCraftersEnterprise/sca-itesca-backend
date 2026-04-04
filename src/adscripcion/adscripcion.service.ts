import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdscripcionDto } from './dto/create-adscripcion.dto';
import { UpdateAdscripcionDto } from './dto/update-adscripcion.dto';

@Injectable()
export class AdscripcionService {
  constructor(private prisma: PrismaService) {}

  // 1. Crear adscripción (Resuelve el error de la línea 17)
  async create(createAdscripcionDto: CreateAdscripcionDto) {
    return this.prisma.adscripcion.create({
      data: createAdscripcionDto,
    });
  }

  // 2. Traer todos
  async findAll() {
    return this.prisma.adscripcion.findMany();
  }

  async findOne(id: number) {
    const adscripcion = await this.prisma.adscripcion.findUnique({
      where: { id },
      include: { usuarios: true } // Por si necesitas ver quiénes pertenecen a ella
    });
    
    if (!adscripcion) throw new NotFoundException(`Adscripción con ID ${id} no encontrada`);
    return adscripcion;
  }
  // 3. Traer uno solo (Resuelve el error de la línea 22)
  async findByClave(clave: string) {
    return this.prisma.adscripcion.findUnique({
      where: { clave },
    });
  }

  // 4. Actualizar (Resuelve el error de la línea 27)
  async update(id: number, updateAdscripcionDto: UpdateAdscripcionDto) {
    return this.prisma.adscripcion.update({
      where: { id },
      data: updateAdscripcionDto,
    });
  }

  // 5. Eliminar (Resuelve el error de la línea 32)
  async remove(id: number) {
    return this.prisma.adscripcion.delete({
      where: { id },
    });
  }
}