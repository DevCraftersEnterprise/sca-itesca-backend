import { Module } from '@nestjs/common';
import { InstructoresService } from './instructores.service';
import { InstructoresController } from './instructores.controller';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Module({
  providers: [InstructoresService, CloudinaryService],
  controllers: [InstructoresController]
})
export class InstructoresModule {}
