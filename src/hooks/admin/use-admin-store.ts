import { create } from 'zustand';

interface AdminState {
  // Selection
  selectedItems: string[];
  setSelectedItems: (ids: string[]) => void;
  toggleSelectedItem: (id: string) => void;
  clearSelection: () => void;
  
  // Navigation
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Search & Filters
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  activeFilters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  // Selection
  selectedItems: [],
  setSelectedItems: (ids) => set({ selectedItems: ids }),
  toggleSelectedItem: (id) => set((state) => ({
    selectedItems: state.selectedItems.includes(id)
      ? state.selectedItems.filter((item) => item !== id)
      : [...state.selectedItems, id],
  })),
  clearSelection: () => set({ selectedItems: [] }),
  
  // Navigation
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  
  // Search & Filters
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  activeFilters: {},
  setFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value },
  })),
  resetFilters: () => set({ activeFilters: {}, globalSearchQuery: '' }),
}));
