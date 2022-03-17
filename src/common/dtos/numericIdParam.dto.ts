import { IsNumberString } from 'class-validator';

/**
 * DTO for numeric 'id' param
 */
export class NumericIdParamDto {
  @IsNumberString()
  id: string;
}
