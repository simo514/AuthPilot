import { create } from 'zustand';
import api from '../lib/api';
import { Project, CreateProjectDto, UpdateProjectDto } from '../types/project.types';
import { User } from '../types/auth.types';
import toast from 'react-hot-toast';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  projectUsers: User[];
  availableUsers: User[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProjectsByOrganization: (organizationId: string) => Promise<void>;
  fetchProjectByUuid: (uuid: string) => Promise<void>;
  createProject: (project: CreateProjectDto) => Promise<Project>;
  updateProject: (uuid: string, project: UpdateProjectDto) => Promise<void>;
  deleteProject: (uuid: string) => Promise<void>;
  fetchProjectUsers: (uuid: string) => Promise<void>;
  fetchAvailableUsers: (uuid: string) => Promise<void>;
  assignUserToProject: (projectUuid: string, userUuid: string) => Promise<void>;
  removeUserFromProject: (projectUuid: string, userUuid: string) => Promise<void>;
}

const extractApiErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return error.message || 'An error occurred';
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  projectUsers: [],
  availableUsers: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/projects');
      set({ projects: response.data, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch projects: ${extractApiErrorMessage(error)}`);
    }
  },

  fetchProjectsByOrganization: async (organizationId: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/projects/organization/${organizationId}`);
      set({ projects: response.data, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch projects: ${extractApiErrorMessage(error)}`);
    }
  },

  fetchProjectByUuid: async (uuid: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/projects/${uuid}`);
      set({ currentProject: response.data, loading: false });
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to fetch project: ${extractApiErrorMessage(error)}`);
    }
  },

  createProject: async (project: CreateProjectDto) => {
    set({ loading: true });
    try {
      const response = await api.post('/projects', project);
      set(state => ({ 
        projects: [...state.projects, response.data], 
        loading: false 
      }));
      toast.success('Project created successfully');
      return response.data;
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to create project: ${extractApiErrorMessage(error)}`);
      throw error;
    }
  },

  updateProject: async (uuid: string, project: UpdateProjectDto) => {
    set({ loading: true });
    try {
      const response = await api.put(`/projects/${uuid}`, project);
      set(state => ({
        projects: state.projects.map(p => p.uuid === uuid ? response.data : p),
        currentProject: state.currentProject?.uuid === uuid ? response.data : state.currentProject,
        loading: false,
      }));
      toast.success('Project updated successfully');
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to update project: ${extractApiErrorMessage(error)}`);
      throw error;
    }
  },

  deleteProject: async (uuid: string) => {
    set({ loading: true });
    try {
      await api.delete(`/projects/${uuid}`);
      set(state => ({
        projects: state.projects.filter(p => p.uuid !== uuid),
        loading: false,
      }));
      toast.success('Project deleted successfully');
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Failed to delete project: ${extractApiErrorMessage(error)}`);
      throw error;
    }
  },

  fetchProjectUsers: async (uuid: string) => {
    try {
      const response = await api.get(`/projects/${uuid}/users`);
      set({ projectUsers: response.data });
    } catch (error: any) {
      toast.error(`Failed to fetch project users: ${extractApiErrorMessage(error)}`);
    }
  },

  fetchAvailableUsers: async (uuid: string) => {
    try {
      const response = await api.get(`/projects/${uuid}/available-users`);
      set({ availableUsers: response.data });
    } catch (error: any) {
      toast.error(`Failed to fetch available users: ${extractApiErrorMessage(error)}`);
    }
  },

  assignUserToProject: async (projectUuid: string, userUuid: string) => {
    try {
      const project = get().currentProject;
      if (!project) return;
      
      await api.post(`/users/${userUuid}/project/${project.uuid}`);
      await get().fetchProjectByUuid(projectUuid);
      await get().fetchProjectUsers(projectUuid);
      await get().fetchAvailableUsers(projectUuid);
      toast.success('User assigned to project successfully');
    } catch (error: any) {
      toast.error(`Failed to assign user: ${extractApiErrorMessage(error)}`);
      throw error;
    }
  },

  removeUserFromProject: async (projectUuid: string, userUuid: string) => {
    try {
      await api.delete(`/users/${userUuid}/project`);
      await get().fetchProjectByUuid(projectUuid);
      await get().fetchProjectUsers(projectUuid);
      await get().fetchAvailableUsers(projectUuid);
      toast.success('User removed from project successfully');
    } catch (error: any) {
      toast.error(`Failed to remove user: ${extractApiErrorMessage(error)}`);
      throw error;
    }
  },
}));
