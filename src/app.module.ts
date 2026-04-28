import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AdscripcionModule } from './adscripcion/adscripcion.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { CursosModule } from './cursos/cursos.module';
import { InstructoresModule } from './instructores/instructores.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    PrismaModule, 
    AdscripcionModule, 
    UsuariosModule, 
    AuthModule, 
    CursosModule, 
    InstructoresModule,
    ScheduleModule.forRoot(),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
