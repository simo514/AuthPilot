import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Audit, AuditDocument } from './audit.schema';
import { Model } from 'mongoose';
import { TenantContextService } from '../organizations/tenant-context.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(Audit.name) private auditModel: Model<AuditDocument>,
    @Optional() @Inject(REQUEST) private request?: Request,
    @Optional() private readonly tenantContext?: TenantContextService,
  ) {}

  async createAudit(
    action: string,
    details?: string,
    response?: Record<string, any>,
    ipAddress?: string,
    status: 'success' | 'failed' = 'success',
    user?: Record<string, any>,
    organizationId?: string | null,
  ): Promise<Audit> {
    const newAudit = new this.auditModel({
      action,
      details,
      response,
      ipAddress,
      status,
      user,
      organizationId,
    });
    return newAudit.save();
  }

  /**
   * @deprecated Use getAllAudits() instead - tenant context automatically filters by organization
   */
  async getAuditsByManagerId(
    managerId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ audits: Audit[]; total: number; page: number; totalPages: number }> {
    const query: any = { 'user.managerId': managerId };

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { 'user.fullName': { $regex: search, $options: 'i' } },
        { 'user.uuid': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await this.auditModel.countDocuments(query);
    const audits = await this.auditModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      audits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllAudits(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ audits: Audit[]; total: number; page: number; totalPages: number }> {
    const query: any = {};

    // Filter by organization from tenant context
    const organizationId = this.tenantContext?.getOrganizationId();
    if (organizationId) {
      query.organizationId = organizationId;
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { 'user.fullName': { $regex: search, $options: 'i' } },
        { 'user.uuid': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await this.auditModel.countDocuments(query);
    const audits = await this.auditModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      audits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAuditbyDateRange(startDate: Date, endDate: Date): Promise<Audit[]> {
    return this.auditModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();
  }

}
