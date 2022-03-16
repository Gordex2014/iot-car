import { AuthGuard } from '@nestjs/passport';
import { Strategies } from '../enums';

export class JwtGuard extends AuthGuard(Strategies.JWT) {
  constructor() {
    super();
  }
}
