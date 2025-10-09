// store/useNavigationStore.ts
import { create } from 'zustand';

interface NavigationState {
  activeSection: string;
  setActiveSection: (section: string) => void;
  navigateToSection: (section: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section: string) => set({ activeSection: section }),
  navigateToSection: (section: string) => set({ activeSection: section }),
}));