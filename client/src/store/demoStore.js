import { create } from 'zustand';

export const useDemoStore = create((set) => ({
  isActive: false,
  currentStep: 0,
  startTour: () => set({ isActive: true, currentStep: 0 }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  stopTour: () => set({ isActive: false, currentStep: 0 })
}));
