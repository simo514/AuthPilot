import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  level?: number;
}
