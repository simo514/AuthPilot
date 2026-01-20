import { useEffect, useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, TaskStatus } from '../../types/task.types';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { Plus, Filter } from 'lucide-react';
import { useIsManager } from '../../hooks/useIsManager';

interface TaskListProps {
  projectUuid: string;
}

export default function TaskList({ projectUuid }: TaskListProps) {
  const { projectTasks, loading, fetchTasksByProject, createTask, updateTask, deleteTask } = useTaskStore();
  const isManager = useIsManager();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasksByProject(projectUuid);
  }, [projectUuid, fetchTasksByProject]);

  const handleCreateTask = async (data: any) => {
    await createTask(data);
  };

  const handleUpdateTask = async (data: any) => {
    if (editingTask) {
      await updateTask(editingTask._id, data);
      setEditingTask(undefined);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (deletingTaskId === taskId) {
      await deleteTask(taskId);
      setDeletingTaskId(null);
    } else {
      setDeletingTaskId(taskId);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const filteredTasks = statusFilter
    ? projectTasks.filter(task => task.status === statusFilter)
    : projectTasks;

  const tasksByStatus = {
    [TaskStatus.TODO]: filteredTasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.IN_REVIEW]: filteredTasks.filter(t => t.status === TaskStatus.IN_REVIEW),
    [TaskStatus.COMPLETED]: filteredTasks.filter(t => t.status === TaskStatus.COMPLETED),
  };

  if (loading && projectTasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.IN_REVIEW}>In Review</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
            </select>
          </div>
        </div>
        
        {isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter ? 'No tasks found with this status.' : 'No tasks yet. Create your first task!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <div key={status} className="space-y-3">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>{status.replace('_', ' ')}</span>
                <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {tasks.length}
                </span>
              </h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={isManager ? handleEdit : undefined}
                    onDelete={isManager ? handleDeleteTask : undefined}
                    isManager={isManager}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm
          projectUuid={projectUuid}
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={handleCloseForm}
        />
      )}

      {deletingTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingTaskId(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deletingTaskId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
