import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalSignInDto, LocalSignUpDto } from './dtos';

@Controller('api/v1/auth')
export class AuthController {
  private _authService: AuthService;

  constructor(authService: AuthService) {
    this._authService = authService;
  }

  @Post('local/signup')
  async signUp(@Body() dto: LocalSignUpDto) {
    return await this._authService.localSignUp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('local/signin')
  async signIn(@Body() dto: LocalSignInDto) {
    return await this._authService.localSignIn(dto);
  }
}
