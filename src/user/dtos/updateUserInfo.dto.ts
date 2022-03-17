import { IsOptional, IsString } from 'class-validator';

export class UpdateUserInfoDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
