import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenDto, LocalSignUpDto, LocalSignInDto } from './dtos';

@Injectable()
export class AuthService {
  private readonly _prismaService: PrismaService;
  private readonly _jwtService: JwtService;
  private readonly _configService: ConfigService;

  constructor(
    prismaService: PrismaService,
    jwtService: JwtService,
    configService: ConfigService,
  ) {
    this._prismaService = prismaService;
    this._jwtService = jwtService;
    this._configService = configService;
  }

  /**
   * Tries to create a new user with the email and password provided
   * @param dto Are the information needed to sign up with the local auth provider
   * @returns A jwt for the new user.
   * @throws a 403 error if the user already exists
   * @throws a 500 error if the user could not be created due to an internal error
   */
  async localSignUp(dto: LocalSignUpDto): Promise<AccessTokenDto> {
    // Generate the password hash
    const passwordHash = await argon.hash(dto.password);

    try {
      // Save the user to the database
      const user = await this._prismaService.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          username: dto.username,
          authProvider: dto.authProvider,
          updatedAt: new Date(Date.now()),
        },
      });

      // Return the jwt
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // If the user is trying to create a field with the constraint unique
        if (error.code === 'P2002') {
          throw new ForbiddenException('User already exists');
        }
      }
      throw new InternalServerErrorException('Could not save user');
    }
  }

  /**
   * Tries to sign in user with the email and password provided
   * @param dto Are the credentials to sign in with the local auth provider
   * @returns a valid jwt.
   * @throws a 403 error if the user does not exist
   * @throws a 403 error if the password is incorrect
   * @throws a 500 error if the user could not be signed in due to an internal error
   */
  async localSignIn(dto: LocalSignInDto): Promise<AccessTokenDto> {
    // Check if the user exists
    const user = await this._prismaService.user.findFirst({
      where: {
        OR: [
          {
            email: dto.usernameOrEmail,
          },
          {
            username: dto.usernameOrEmail,
          },
        ],
      },
    });

    if (!user) {
      throw new ForbiddenException('Incorrect password or email');
    }

    // Check if the password is correct
    const pwIsCorrect = await argon.verify(user.password, dto.password);

    if (!pwIsCorrect) {
      throw new ForbiddenException('Incorrect password or email');
    }

    // Return the jwt
    return this.signToken(user.id, user.email);
  }

  /**
   * Signs a jwt for the user with the provided id and email for a
   * @param userId The id of the user to sign in
   * @param email Is the email of the user to sign in
   * @returns The jwt for the user
   */
  private async signToken(
    userId: number,
    email: string,
  ): Promise<AccessTokenDto> {
    const payload = {
      // sub is the subject of the token, using 'sub' instead of 'id' is recommended in JWT
      sub: userId,
      email,
    };

    const token = await this._jwtService.signAsync(payload, {
      expiresIn: this._configService.get<string>('jwt.expiration'),
      secret: this._configService.get<string>('jwt.secret'),
    });

    return {
      access_token: token,
    };
  }
}
