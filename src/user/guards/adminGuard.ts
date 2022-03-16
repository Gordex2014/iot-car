import { ExecutionContext, Logger } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Guard used to check if the user is an admin, the user should be authenticated
 * prior to this guard.
 */
export class AdminGuard {
  private readonly _logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }

    const role = (user as User).role;
    if (role !== 'ADMIN') {
      this._logger.warn(`User with id ${user.id} tried to access admin route`);
      return false;
    }

    this._logger.log(`User with id ${user.id} accessing admin route`);
    return true;
  }
}
