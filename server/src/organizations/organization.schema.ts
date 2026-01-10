import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { OrganizationStatus } from './enums/organization-status.enum';
import { SubscriptionPlan } from './enums/subscription-plan.enum';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({
    default: () => randomUUID(),
    unique: true,
    index: true,
  })
  uuid: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  })
  slug: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
    default: '',
  })
  description: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/,
  })
  domain: string;

  @Prop({
    type: String,
    enum: Object.values(OrganizationStatus),
    default: OrganizationStatus.ACTIVE,
    index: true,
  })
  status: OrganizationStatus;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionPlan),
    default: SubscriptionPlan.FREE,
    index: true,
  })
  subscriptionPlan: SubscriptionPlan;

  @Prop({
    type: Number,
    default: 10,
    min: 1,
  })
  maxUsers: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  currentUsers: number;

  @Prop({
    type: Object,
    default: {},
  })
  settings: {
    allowSelfRegistration?: boolean;
    requireEmailVerification?: boolean;
    allowedEmailDomains?: string[];
    timezone?: string;
    dateFormat?: string;
    logo?: string;
    primaryColor?: string;
    [key: string]: any;
  };

  @Prop({
    type: String,
    required: false,
  })
  ownerId: string;

  @Prop({
    type: Date,
    default: null,
  })
  subscriptionExpiresAt: Date;

  @Prop({
    type: Date,
    default: null,
  })
  trialEndsAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Create compound indexes
OrganizationSchema.index({ status: 1, subscriptionPlan: 1 });
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ domain: 1 }, { unique: true, sparse: true });
