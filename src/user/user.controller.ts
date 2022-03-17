import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { NumericIdParamDto } from 'src/common/dtos';
import { GetUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';
import { UpdateUserInfoDto, UpdateUserPasswordDto } from './dtos';
import { AdminGuard } from './guards';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('api/v1/users')
export class UserController {
  private readonly _userService: UserService;
  private readonly _logger = new Logger(UserController.name);

  constructor(userService: UserService) {
    this._userService = userService;
  }

  @Get()
  @UseGuards(AdminGuard)
  getAll(@GetUser() user: User) {
    this._logger.log(`Admin with id ${user.id} retrieving all users info`);
    return this._userService.findAll();
  }

  @Get('me')
  getMe(@GetUser() user: User) {
    this._logger.log(`Data for user with id ${user.id} retrieved`);
    return user;
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  getById(@GetUser() user: User, @Param() { id }: NumericIdParamDto) {
    this._logger.log(
      `Admin with id ${user.id} trying to retrieve user ${id} info`,
    );
    return this._userService.findById(Number(id));
  }

  @Patch('me')
  updateMe(@GetUser() user: User, @Body() dto: UpdateUserInfoDto) {
    this._logger.log(`User ${user.id} trying to update his/her info`);
    return this._userService.updateById(user.id, dto);
  }

  @Patch('password/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateMyPassword(
    @GetUser() user: User,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    this._logger.log(`User ${user.id} trying to update his/her password`);
    await this._userService.updatePasswordById(user.id, dto);
  }

  @Delete('me')
  deleteMe(@GetUser() user: User) {
    this._logger.log(`User ${user.id} deleting his/her account`);
    return this._userService.deleteById(1);
  }
}
