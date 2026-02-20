import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Audit, AuditDocument } from './audit.schema';
import { Model } from 'mongoose';


@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);
  private isCleanupRunning = false;

  constructor(
    @InjectModel(Audit.name) private auditModel: Model<AuditDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: 'audit-cleanup',
  })
  async cleanupOldAudits() {
    if (this.isCleanupRunning) {
      this.logger.log('Audit cleanup already in progress, skipping...');
      return;
    }

    this.isCleanupRunning = true;
    try {
      const totalCount = await this.auditModel.countDocuments();
      if (totalCount > 100) {
        const deleteCount = totalCount - 100;
        const oldestLogs = await this.auditModel
          .find()
          .sort({ createdAt: 1 })
          .limit(deleteCount)
          .select('_id');
        const idsToDelete = oldestLogs.map((log) => log._id);
        await this.auditModel.deleteMany({ _id: { $in: idsToDelete } });
        this.logger.log(`Cleaned up ${idsToDelete.length} old audit logs`);
      }
    } catch (error) {
      this.logger.error('Error during audit cleanup:', error);
    } finally {
      this.isCleanupRunning = false;
    }
  }
}
