import { Module } from '@nestjs/common';
import { AdscripcionService } from './adscripcion.service';
import { AdscripcionController } from './adscripcion.controller';

@Module({
  controllers: [AdscripcionController],
  providers: [AdscripcionService],
})
export class AdscripcionModule {}
