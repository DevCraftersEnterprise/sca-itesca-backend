import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'PALABRA_SECRETA_SUPER_SEGURA', // Usa la misma que en AuthModule
    });
  }

  async validate(payload: any) {
    // Este objeto es el que llega al RolesGuard como 'request.user'
    return { id: payload.sub, email: payload.email, rol: payload.rol };
  }
}