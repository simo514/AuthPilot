import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Audit, AuditDocument } from './audit.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuditService {
    private isCleanupRunning = false;

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
        return newAudit.save();
    }

    async getAuditsByManagerId(
        managerId: string,
        page: number = 1,
        limit: number = 10,
        search?: string
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
        search?: string
    ): Promise<{ audits: Audit[]; total: number; page: number; totalPages: number }> {
        const query: any = {};

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
        return this.auditModel.find({
            createdAt: { $gte: startDate, $lte: endDate },
        }).exec();
    }

    @Cron(CronExpression.EVERY_DAY_AT_10AM, {
        name: 'audit-cleanup',
    })
    async cleanupOldAudits() {
        if (this.isCleanupRunning) {
            console.log('Audit cleanup already in progress, skipping...');
            return;
        }

        this.isCleanupRunning = true;
        try {
            const totalCount = await this.auditModel.countDocuments();
            if (totalCount > 100) {
                const deleteCount = totalCount - 50;
                const oldestLogs = await this.auditModel
                    .find()
                    .sort({ createdAt: 1 })
                    .limit(deleteCount)
                    .select('_id');
                const idsToDelete = oldestLogs.map(log => log._id);
                await this.auditModel.deleteMany({ _id: { $in: idsToDelete } });
                console.log(`Cleaned up ${idsToDelete.length} old audit logs`);
            }
        } catch (error) {
            console.error('Error during audit cleanup:', error);
        } finally {
            this.isCleanupRunning = false;
        }
    }
}
