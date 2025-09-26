import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  due_today: number;
  overdue: number;
}

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  currentFilter: 'all' | 'completed' | 'pending';
  searchQuery: string;
  sortBy: 'created_at' | 'updated_at' | 'due_date' | 'title';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  stats: TaskStats | null;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setFilter: (filter: 'all' | 'completed' | 'pending') => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setLoading: (loading: boolean) => void;
  setStats: (stats: TaskStats) => void;
  applyFilters: () => void;
  
  // Offline sync
  saveOfflineTasks: () => Promise<void>;
  loadOfflineTasks: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  currentFilter: 'all',
  searchQuery: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  isLoading: false,
  stats: null,

  setTasks: (tasks: Task[]) => {
    set({ tasks });
    get().applyFilters();
    get().saveOfflineTasks();
  },

  addTask: (task: Task) => {
    const tasks = [task, ...get().tasks];
    set({ tasks });
    get().applyFilters();
    get().saveOfflineTasks();
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    const tasks = get().tasks.map(task =>
      task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
    );
    set({ tasks });
    get().applyFilters();
    get().saveOfflineTasks();
  },

  removeTask: (id: string) => {
    const tasks = get().tasks.filter(task => task.id !== id);
    set({ tasks });
    get().applyFilters();
    get().saveOfflineTasks();
  },

  setFilter: (filter: 'all' | 'completed' | 'pending') => {
    set({ currentFilter: filter });
    get().applyFilters();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => {
    set({ 
      sortBy: sortBy as 'created_at' | 'updated_at' | 'due_date' | 'title',
      sortOrder 
    });
    get().applyFilters();
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setStats: (stats: TaskStats) => {
    set({ stats });
  },

  applyFilters: () => {
    const { tasks, currentFilter, searchQuery, sortBy, sortOrder } = get();
    
    let filtered = [...tasks];

    // Apply status filter
    if (currentFilter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default: // created_at
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    set({ filteredTasks: filtered });
  },

  saveOfflineTasks: async () => {
    try {
      const { tasks } = get();
      await AsyncStorage.setItem('offline_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving offline tasks:', error);
    }
  },

  loadOfflineTasks: async () => {
    try {
      const tasksData = await AsyncStorage.getItem('offline_tasks');
      if (tasksData) {
        const tasks = JSON.parse(tasksData);
        set({ tasks });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Error loading offline tasks:', error);
    }
  },

  clearOfflineData: async () => {
    try {
      await AsyncStorage.removeItem('offline_tasks');
      set({ tasks: [], filteredTasks: [] });
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  },
}));