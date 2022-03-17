import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInfoDto, UpdateUserPasswordDto } from './dtos';

@Injectable()
export class UserService {
  private readonly _prisma: PrismaService;
  private readonly _logger = new Logger(UserService.name);

  constructor(prisma: PrismaService) {
    this._prisma = prisma;
  }

  /**
   * Retrieves all the users from the database
   * @requires Admin access
   * @returns All the users in the database
   * @throws a 500 error if there is a problem connecting to the database
   */
  async findAll(): Promise<User[]> {
    try {
      const users = await this._prisma.user.findMany({
        where: {
          isActive: true,
        },
      });

      users.forEach((user) => {
        delete user.password;
        delete user.authProvider;
        delete user.isActive;
      });

      this._logger.log('All users retrieved');
      return users;
    } catch (error) {
      this._logger.error('Error connecting to database');
      throw new InternalServerErrorException(
        'Internal server error, please contact support',
      );
    }
  }

  /**
   * Tries to find a user by its id
   * @requires Admin access
   * @param id The id of the user to retrieve
   * @returns The user with the provided id
   * @throws a 404 error if the user does not exist
   * @throws a 500 error if there is a problem connecting to the database
   */
  async findById(id: number): Promise<User> {
    try {
      const user = await this._prisma.user.findFirst({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new Error('404');
      }

      delete user.password;
      delete user.authProvider;
      delete user.isActive;

      this._logger.log(`User with id ${id} retrieved`);
      return user;
    } catch (error) {
      if (error.message === '404') {
        this._logger.log(`User with id ${id} not found`);
        throw new NotFoundException('User not found');
      }
      this._logger.error('Error connecting to database');
      throw new InternalServerErrorException(
        'Internal server error, please contact support',
      );
    }
  }

  /**
   * Tries to update a user by its id
   * @param id The id of the user to update
   * @param dto are the new values to update
   * @returns the updated user
   * @throws a 404 error if the user does not exist
   * @throws a 500 error if there is a problem connecting to the database
   */
  async updateById(id: number, dto: UpdateUserInfoDto): Promise<User> {
    try {
      const updatedUser = await this._prisma.user.update({
        where: { id },
        data: {
          ...dto,
        },
      });

      delete updatedUser.password;
      delete updatedUser.authProvider;
      delete updatedUser.isActive;

      this._logger.log(`User with id ${id} updated`);
      return updatedUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this._logger.log(`User with id ${id} not found`);
          throw new NotFoundException('User not found');
        }
      }
      this._logger.error('Error connecting to database');
      throw new InternalServerErrorException(
        'Internal server error, please contact support',
      );
    }
  }

  /**
   * Tries to update a user's password by its id
   * @param id The id of the user to update
   * @param dto Are the old password and the new password to update
   * @throws a 404 error if the user does not exist
   * @throws a 401 error if the old password is incorrect
   * @throws a 500 error if there is a problem connecting to the database
   */
  async updatePasswordById(
    id: number,
    dto: UpdateUserPasswordDto,
  ): Promise<void> {
    try {
      const user = await this._prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error('404');
      }

      // Check if the password is correct
      const pwIsCorrect = await argon.verify(user.password, dto.oldPassword);
      if (!pwIsCorrect) {
        throw new Error('401');
      }

      // Update the password
      await this._prisma.user.update({
        where: { id },
        data: {
          password: await argon.hash(dto.newPassword),
        },
      });
      this._logger.log(`Password of user with id ${id} updated`);
    } catch (error) {
      if (error.message === '401') {
        this._logger.log(`Password of user with id ${id} incorrect`);
        throw new UnauthorizedException('User not found');
      }
      if (error.message === '404') {
        this._logger.log(`User with id ${id} not found`);
        throw new NotFoundException('User not found');
      }
      this._logger.error('Error connecting to database');
      throw new InternalServerErrorException(
        'Internal server error, please contact support',
      );
    }
  }

  /**
   * Tries to delete a user by its id
   * @param id The id of the user to delete
   * @throws a 404 error if the user does not exist
   * @throws a 500 error if there is a problem connecting to the database
   */
  async deleteById(id: number): Promise<void> {
    try {
      await this._prisma.user.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      this._logger.log(`Account of user with id ${id} deactivated`);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this._logger.log(`User with id ${id} not found`);
          throw new NotFoundException('User not found');
        }
      }
      this._logger.error('Error connecting to database');
      throw new InternalServerErrorException(
        'Internal server error, please contact support',
      );
    }
  }
}
