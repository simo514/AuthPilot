import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { Calendar, User, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  showProject?: boolean;
  isManager?: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, showProject = false, isManager = false }: TaskCardProps) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case TaskStatus.IN_REVIEW:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case TaskPriority.HIGH:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case TaskPriority.URGENT:
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const formatStatus = (status: TaskStatus) => {
    return status.replace('_', ' ');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
        {isManager && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task._id)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{task.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {formatStatus(task.status)}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {showProject && typeof task.project === 'object' && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="font-medium">Project:</span>
            <span className="ml-2">{task.project.name}</span>
          </div>
        )}
        
        {task.assignedTo && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4 mr-2" />
            <span>{task.assignedTo.fullName}</span>
          </div>
        )}
        
        {task.dueDate && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
