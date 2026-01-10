import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  IsObject,
  IsEmail,
} from 'class-validator';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/, {
    message: 'Invalid domain format',
  })
  domain?: string;

  @IsEnum(OrganizationStatus)
  @IsOptional()
  status?: OrganizationStatus;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlan;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10000)
  maxUsers?: number;

  @IsObject()
  @IsOptional()
  settings?: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    allowedEmailDomains?: string[];
    timezone?: string;
    dateFormat?: string;
    logo?: string;
    primaryColor?: string;
  };

  @IsString()
  @IsOptional()
  ownerId?: string;
}
