import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Run standard JWT authentication first
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // If JWT is invalid, throw standard unauthorized
    if (err || !user) {
      throw err || new ForbiddenException('Authentication required');
    }

    // Check the isAdmin flag we embedded in the JWT payload
    if (!user.isAdmin) {
      throw new ForbiddenException('Admin privileges required');
    }

    return user;
  }
}
