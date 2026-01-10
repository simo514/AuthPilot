import {
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class AssignUserToOrganizationDto {
  @IsString()
  @IsNotEmpty()
  userUuid: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
