import { create } from 'zustand';
import { taskService } from '../services/taskService';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task.types';
import toast from 'react-hot-toast';

interface TaskState {
  tasks: Task[];
  projectTasks: Task[];
  myTasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  fetchTasks: () => Promise<void>;
  fetchTasksByProject: (projectUuid: string) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (task: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, task: UpdateTaskRequest) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearProjectTasks: () => void;
}

const extractApiErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return error.message || 'An error occurred';
};

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  projectTasks: [],
  myTasks: [],
  currentTask: null,
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await taskService.getAll();
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch tasks: ${extractApiErrorMessage(error)}`);
    }
  },

  fetchTasksByProject: async (projectUuid: string) => {
    set({ loading: true });
    try {
      const projectTasks = await taskService.getByProject(projectUuid);
      set({ projectTasks, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch project tasks: ${extractApiErrorMessage(error)}`);
    }
  },

  fetchMyTasks: async () => {
    set({ loading: true });
    try {
      const myTasks = await taskService.getMyTasks();
      set({ myTasks, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch your tasks: ${extractApiErrorMessage(error)}`);
    }
  },

  fetchTaskById: async (id: string) => {
    set({ loading: true });
    try {
      const currentTask = await taskService.getById(id);
      set({ currentTask, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch task: ${extractApiErrorMessage(error)}`);
    }
  },

  createTask: async (task: CreateTaskRequest) => {
    set({ loading: true });
    try {
      const newTask = await taskService.create(task);
      set(state => ({ 
        tasks: [...state.tasks, newTask],
        projectTasks: [...state.projectTasks, newTask],
        loading: false 
      }));
      toast.success('Task created successfully');
      return newTask;
    } catch (error: any) {
      set({ loading: false });
      const errorMsg = extractApiErrorMessage(error);
      toast.error(`Failed to create task: ${errorMsg}`);
      throw error;
    }
  },

  updateTask: async (id: string, task: UpdateTaskRequest) => {
    set({ loading: true });
    try {
      const updatedTask = await taskService.update(id, task);
      set(state => ({
        tasks: state.tasks.map(t => t._id === id ? updatedTask : t),
        projectTasks: state.projectTasks.map(t => t._id === id ? updatedTask : t),
        myTasks: state.myTasks.map(t => t._id === id ? updatedTask : t),
        currentTask: state.currentTask?._id === id ? updatedTask : state.currentTask,
        loading: false
      }));
      toast.success('Task updated successfully');
    } catch (error: any) {
      set({ loading: false });
      const errorMsg = extractApiErrorMessage(error);
      toast.error(`Failed to update task: ${errorMsg}`);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true });
    try {
      await taskService.delete(id);
      set(state => ({
        tasks: state.tasks.filter(t => t._id !== id),
        projectTasks: state.projectTasks.filter(t => t._id !== id),
        myTasks: state.myTasks.filter(t => t._id !== id),
        loading: false
      }));
      toast.success('Task deleted successfully');
    } catch (error: any) {
      set({ loading: false });
      const errorMsg = extractApiErrorMessage(error);
      toast.error(`Failed to delete task: ${errorMsg}`);
      throw error;
    }
  },

  clearProjectTasks: () => {
    set({ projectTasks: [] });
  },
}));
