import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../roles/enums/permission.enum';
import { TenantContextInterceptor } from '../organizations/tenant-context.interceptor';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const userId = req.user.uuid;
    return await this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @RequirePermissions(Permission.TASK_LIST)
  async findAll() {
    return await this.tasksService.findAll();
  }

  @Get('my-tasks')
  @RequirePermissions(Permission.TASK_READ)
  async findMyTasks(@Request() req) {
    const userId = req.user.uuid;
    return await this.tasksService.findMyTasks(userId);
  }

  @Get('project/:projectUuid')
  @RequirePermissions(Permission.TASK_LIST)
  async findByProject(@Param('projectUuid') projectUuid: string) {
    return await this.tasksService.findByProject(projectUuid);
  }

  @Get(':id')
  @RequirePermissions(Permission.TASK_READ)
  async findOne(@Param('id') id: string) {
    return await this.tasksService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  async update(
    @Param('id') id: string, 
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    const userId = req.user.uuid;
    return await this.tasksService.update(id, updateTaskDto, userId);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  async delete(@Param('id') id: string, @Request() req) {
    const userId = req.user.uuid;
    return await this.tasksService.delete(id, userId);
  }
}
