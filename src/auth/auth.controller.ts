import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalSignInDto, LocalSignUpDto } from './dtos';

@Controller('api/v1/auth')
export class AuthController {
  private _authService: AuthService;
  private readonly _logger = new Logger(AuthController.name);

  constructor(authService: AuthService) {
    this._authService = authService;
  }

  @Post('local/signup')
  async signUp(@Body() dto: LocalSignUpDto) {
    this._logger.log(`Trying to sign up user with email ${dto.email}`);
    return await this._authService.localSignUp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('local/signin')
  async signIn(@Body() dto: LocalSignInDto) {
    this._logger.log(
      `Trying to sign up user with email or username ${dto.usernameOrEmail}`,
    );
    return await this._authService.localSignIn(dto);
  }
}
