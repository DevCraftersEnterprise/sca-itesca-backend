import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}
  async login(correo: string, pass: string) {
    // 1. Buscamos al usuario por correo
    // Nota: Necesitas un método 'findByEmail' en tu UsuariosService
    const usuario = await this.usuariosService.findByEmail(correo);
    if (!usuario) {
      throw new UnauthorizedException('No se encontro usuario');
    }
    // 2. Comparamos la contraseña encriptada
    const isMatch = await bcrypt.compare(pass, usuario.contrasena);
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña inválida');
    }
    // 3. Si todo está bien, generamos el Token con su ROL
    const payload = { sub: usuario.id, email: usuario.correo, rol: usuario.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id:usuario.id,
        nomina: usuario.nomina,
        rol: usuario.rol,
        adscripcion: usuario.adscripcion ? usuario.adscripcion.clave : null,
        nombres: usuario.nombres, 
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        puesto: usuario.puesto,

      }
    };
  }
}