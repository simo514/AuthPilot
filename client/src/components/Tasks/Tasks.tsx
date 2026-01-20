import { useEffect, useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { Plus, Filter, ListTodo } from 'lucide-react';
import { useIsManager } from '../../hooks/useIsManager';

export default function Tasks() {
  const { tasks, myTasks, loading, fetchTasks, fetchMyTasks, createTask, updateTask, deleteTask } = useTaskStore();
  const isManager = useIsManager();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isManager) {
      fetchTasks();
    } else {
      fetchMyTasks();
    }
  }, [isManager, fetchTasks, fetchMyTasks]);

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

  const displayTasks = isManager ? tasks : myTasks;
  const filteredTasks = displayTasks.filter(task => {
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    [TaskStatus.TODO]: filteredTasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.IN_REVIEW]: filteredTasks.filter(t => t.status === TaskStatus.IN_REVIEW),
    [TaskStatus.COMPLETED]: filteredTasks.filter(t => t.status === TaskStatus.COMPLETED),
  };

  if (loading && displayTasks.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ListTodo className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isManager ? 'All Tasks' : 'My Tasks'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isManager 
                ? 'Manage tasks across all projects' 
                : 'Tasks assigned to you'}
            </p>
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All</option>
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.IN_REVIEW}>In Review</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All</option>
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
          <div key={status} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {status.replace('_', ' ')}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
          </div>
        ))}
      </div>

      {/* Tasks Board */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {isManager 
              ? 'No tasks yet. Create your first task!' 
              : 'No tasks assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <div key={status} className="space-y-3">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                <span>{status.replace('_', ' ')}</span>
                <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
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
                    showProject={true}
                    isManager={isManager}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Form Modal - Only for managers and needs project UUID */}
      {showForm && isManager && (
        <TaskFormWithProjectSelect
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={handleCloseForm}
        />
      )}

      {/* Delete Confirmation Modal */}
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

// Wrapper component for task form that handles project selection
function TaskFormWithProjectSelect({ task, onSubmit, onCancel }: any) {
  const [selectedProjectUuid, setSelectedProjectUuid] = useState(
    task && typeof task.project === 'object' ? task.project.uuid : ''
  );
  const [showProjectSelector, setShowProjectSelector] = useState(!task);
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectSelected = () => {
    if (selectedProjectUuid) {
      setShowProjectSelector(false);
    }
  };

  if (showProjectSelector) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Select Project
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Choose a project for this task:
          </p>
          <select
            value={selectedProjectUuid}
            onChange={(e) => setSelectedProjectUuid(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
          >
            <option value="">Select a project...</option>
            {projects.map((project: any) => (
              <option key={project.uuid} value={project.uuid}>
                {project.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProjectSelected}
              disabled={!selectedProjectUuid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TaskForm
      projectUuid={selectedProjectUuid || (typeof task?.project === 'object' ? task.project.uuid : task?.project)}
      task={task}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
