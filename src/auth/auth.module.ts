import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module'; // Importante para buscar al usuario
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.register({
      secret: 'PALABRA_SECRETA_SUPER_SEGURA', // En producción usa variables de entorno
      signOptions: { expiresIn: '8h' }, // El token dura 8 horas
    }),
  ],
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}