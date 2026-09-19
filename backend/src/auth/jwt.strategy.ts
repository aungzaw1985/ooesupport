	import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_dev_key', // Should be in your .env
    });
  }

  // This payload is what we signed in the AuthService
    async validate(payload: any) {
    return { 
      id: payload.sub, 
      email: payload.email, 
      isAdmin: payload.isAdmin || false,
      // Ensure role is UPPERCASE
      role: (payload.role || 'AGENT').toUpperCase(),
      deptId: payload.deptId || null,
      teamId: payload.teamId || null,
      orgId: payload.orgId || null,
      kbRole: payload.kbRole || 'NONE'
    };
  }
}
