import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Audit, AuditDocument } from './audit.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuditService {
    constructor(@InjectModel(Audit.name) private auditModel: Model<AuditDocument>) {}

    async createAudit(userUuid: string, action: string, details: Record<string, any>, ipAddress?: string): Promise<Audit> {
        const newAudit = new this.auditModel({
            userUuid: userUuid === 'anonymous' ? null : userUuid,
            action,
            details,
            ipAddress,
        });
        return newAudit.save();
    }

    async getAuditsByUser(userUuid: string): Promise<Audit[]> {
        return this.auditModel.find({ userUuid }).exec();
    }

    async getAllAudits(): Promise<Audit[]> {
        return this.auditModel.find().exec();
    }

    async getAuditbyDateRange(startDate: Date, endDate: Date): Promise<Audit[]> {
        return this.auditModel.find({
            createdAt: { $gte: startDate, $lte: endDate },
        }).exec();
    }   
}
