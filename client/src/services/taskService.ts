import { api } from '../lib/api';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/task.types';

export const taskService = {
  // Get all tasks
  async getAll(): Promise<Task[]> {
    const response = await api.get('/tasks');
    return response.data;
  },

  // Get tasks for a specific project
  async getByProject(projectUuid: string): Promise<Task[]> {
    const response = await api.get(`/tasks/project/${projectUuid}`);
    return response.data;
  },

  // Get my assigned tasks
  async getMyTasks(): Promise<Task[]> {
    const response = await api.get('/tasks/my-tasks');
    return response.data;
  },

  // Get single task
  async getById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  async create(data: CreateTaskRequest): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};
