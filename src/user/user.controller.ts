import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

@UseGuards(JwtGuard)
@Controller('api/v1/user')
export class UserController {
  private readonly _logger = new Logger(UserController.name);

  @Get('me')
  getMe(@GetUser() user: User) {
    this._logger.log(`Data for user with id ${user.id} retrieved`);
    return user;
  }
}
