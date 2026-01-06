import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Audit, AuditDocument } from './audit.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuditService {
    constructor(@InjectModel(Audit.name) private auditModel: Model<AuditDocument>) {}

    async createAudit(action: string, details?: string, response?: Record<string, any>, ipAddress?: string, status: 'success' | 'failed' = 'success', user?: Record<string, any>): Promise<Audit> {
        const newAudit = new this.auditModel({
            action,
            details,
            response,
            ipAddress,
            status,
            user,
        });
        const savedAudit = await newAudit.save();

        // Check total count and delete oldest 50 if >= 100
        const totalCount = await this.auditModel.countDocuments();
        if (totalCount >= 100) {
            const oldestLogs = await this.auditModel.find().sort({ createdAt: 1 }).limit(50).select('_id');
            const idsToDelete = oldestLogs.map(log => log._id);
            await this.auditModel.deleteMany({ _id: { $in: idsToDelete } });
        }
        return savedAudit;
    }

    async getAuditsByUser(userUuid: string): Promise<Audit[]> {
        return this.auditModel.find({ 'user.uuid': userUuid }).exec();
    }

    async getAuditsByManagerId(managerId: string): Promise<Audit[]> {
        return this.auditModel.find({ 'user.managerId': managerId }).sort({ createdAt: -1 }).limit(20).exec();
    }

    async getAllAudits(): Promise<Audit[]> {
        return this.auditModel.find().sort({ createdAt: -1 }).limit(20).exec();
    }

    async getAuditbyDateRange(startDate: Date, endDate: Date): Promise<Audit[]> {
        return this.auditModel.find({
            createdAt: { $gte: startDate, $lte: endDate },
        }).exec();
    }   
}
