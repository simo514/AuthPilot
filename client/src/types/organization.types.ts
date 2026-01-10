// ============================================
// ORGANIZATION TYPES
// ============================================

export enum OrganizationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface Organization {
  uuid: string;
  name: string;
  slug: string;
  description: string;
  domain?: string;
  status: OrganizationStatus;
  subscriptionPlan: SubscriptionPlan;
  maxUsers: number;
  currentUsers: number;
  settings: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    allowedEmailDomains?: string[];
    timezone?: string;
    dateFormat?: string;
    logo?: string;
    primaryColor?: string;
  };
  ownerId: string;
  subscriptionExpiresAt?: Date | string;
  trialEndsAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  status?: OrganizationStatus;
  subscriptionPlan?: SubscriptionPlan;
  maxUsers?: number;
  settings?: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    allowedEmailDomains?: string[];
    timezone?: string;
    dateFormat?: string;
    logo?: string;
    primaryColor?: string;
  };
  ownerId?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  description?: string;
  domain?: string;
  status?: OrganizationStatus;
  subscriptionPlan?: SubscriptionPlan;
  maxUsers?: number;
  settings?: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    allowedEmailDomains?: string[];
    timezone?: string;
    dateFormat?: string;
    logo?: string;
    primaryColor?: string;
  };
  ownerId?: string;
}

export interface PaginatedOrganizations {
  organizations: Organization[];
  total: number;
}

export interface OrganizationFilters {
  status?: OrganizationStatus;
  page?: number;
  limit?: number;
}
