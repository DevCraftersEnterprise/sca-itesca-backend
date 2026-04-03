import { Module } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CursosController } from './cursos.controller';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
@Module({
  
  controllers: [CursosController],
  providers: [CursosService, CloudinaryService],
})
export class CursosModule {}
 