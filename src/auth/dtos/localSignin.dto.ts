import { IsNotEmpty, IsString } from 'class-validator';

export class LocalSignInDto {
  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
