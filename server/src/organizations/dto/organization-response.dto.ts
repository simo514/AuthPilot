import { Exclude, Expose, Type } from 'class-transformer';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

@Exclude()
export class OrganizationResponseDto {
  @Expose()
  uuid: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description: string;

  @Expose()
  domain: string;

  @Expose()
  status: OrganizationStatus;

  @Expose()
  subscriptionPlan: SubscriptionPlan;

  @Expose()
  maxUsers: number;

  @Expose()
  currentUsers: number;

  @Expose()
  settings: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    allowedEmailDomains?: string[];
    timezone?: string;
    dateFormat?: string;
    logo?: string;
    primaryColor?: string;
  };

  @Expose()
  ownerId: string;

  @Expose()
  subscriptionExpiresAt: Date;

  @Expose()
  trialEndsAt: Date;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
