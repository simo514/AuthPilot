import { Controller, Get, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
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
    async getAllAudits(@Request() req): Promise<AuditResponseDto[]> {
        const currentUser = req.user;
        let audits: any[];

        // Check if user is a manager (role is stored as string in user schema)
        if (currentUser.role === 'manager') {
            audits = await this.auditService.getAuditsByManagerId(currentUser.uuid);
        } else {
            audits = await this.auditService.getAllAudits();
        }

        return plainToInstance(AuditResponseDto, audits, { excludeExtraneousValues: true });
    }
}
