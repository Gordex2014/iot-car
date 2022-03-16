import { AuthProvider } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LocalSignUpDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  authProvider = AuthProvider.LOCAL;
}
