import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class KbRoleGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Run standard JWT authentication first
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new ForbiddenException('Authentication required');
    }

    // Allow if Admin OR has any KB Role
    if (user.isAdmin || ['KB_CREATOR', 'KB_REVIEWER', 'KB_APPROVER'].includes(user.kbRole)) {
      return user;
    }

    throw new ForbiddenException('KB privileges required to manage hierarchy.');
  }
}