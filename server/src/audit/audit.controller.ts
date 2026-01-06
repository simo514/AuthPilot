import { Controller, Get, HttpCode, HttpStatus, UseGuards, Request, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditResponseDto } from './dto/audit-response.dto';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Controller('audits')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
    constructor(
        private auditService: AuditService,
        private usersService: UsersService,
    ) {}

   @Get()
   @HttpCode(HttpStatus.OK)
    async getAllAudits(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string
    ) {
        const currentUser = req.user;
        const pageNum = parseInt(page || '1', 10);
        const limitNum = parseInt(limit || '10', 10);

        let result: any;

        // Check if user is a manager (role is stored as string in user schema)
        if (currentUser.role === 'manager') {
            result = await this.auditService.getAuditsByManagerId(
                currentUser.uuid,
                pageNum,
                limitNum,
                search
            );
        } else {
            result = await this.auditService.getAllAudits(pageNum, limitNum, search);
        }

        return {
            audits: plainToInstance(AuditResponseDto, result.audits, { excludeExtraneousValues: true }),
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
        };
    }
}
