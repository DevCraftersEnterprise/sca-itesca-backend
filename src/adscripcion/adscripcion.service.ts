import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdscripcionDto } from './dto/create-adscripcion.dto';
import { UpdateAdscripcionDto } from './dto/update-adscripcion.dto';

@Injectable()
export class AdscripcionService {
  constructor(private prisma: PrismaService) {}

  // 1. Crear adscripción 
  async create(createAdscripcionDto: CreateAdscripcionDto) {
    return this.prisma.adscripcion.create({
      data: createAdscripcionDto,
    });
  }

  // 2. Traer todos
  async findAll() {
    return await this.prisma.adscripcion.findMany({
      include: { usuarios: true, },
    });
  }

  // 3. Traer uno solo - no se usa
  async findOne(nombre: string) {
    return this.prisma.adscripcion.findUnique({
      where: { nombre },
    });
  }

  // 4. Actualizar - no se usa
  async update(id: number, updateAdscripcionDto: UpdateAdscripcionDto) {
    return this.prisma.adscripcion.update({
      where: { id },
      data: updateAdscripcionDto,
    });
  }

  // 5. Eliminar - no se usa
  async remove(id: number) {
    return this.prisma.adscripcion.delete({
      where: { id },
    });
  }
}