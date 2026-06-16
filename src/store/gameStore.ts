import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultPose } from "@/data/gameData";
import type { PerformanceData, PerformanceFrameData, PuppetPoseData, RoleId, WorkshopStep } from "@/types/game";

interface GameState {
  selectedRoleId: RoleId;
  completedSteps: WorkshopStep[];
  colors: Record<string, string>;
  jointQuality: number;
  currentPose: PuppetPoseData;
  activePerformance?: PerformanceData;
  selectRole: (roleId: RoleId) => void;
  completeStep: (step: WorkshopStep) => void;
  setColor: (region: string, color: string) => void;
  setJointQuality: (quality: number) => void;
  setPose: (pose: PuppetPoseData) => void;
  savePerformance: (frames: PerformanceFrameData[], score: number) => PerformanceData;
  resetWorkshop: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      selectedRoleId: "wukong",
      completedSteps: [],
      colors: {
        face: "#F4E5C0",
        robe: "#C0442D",
        prop: "#D99A2B",
      },
      jointQuality: 0,
      currentPose: defaultPose,
      selectRole: (roleId) =>
        set({
          selectedRoleId: roleId,
          completedSteps: [],
          jointQuality: 0,
          currentPose: defaultPose,
        }),
      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),
      setColor: (region, color) =>
        set((state) => ({
          colors: {
            ...state.colors,
            [region]: color,
          },
        })),
      setJointQuality: (quality) => set({ jointQuality: Math.max(0, Math.min(100, quality)) }),
      setPose: (pose) => set({ currentPose: pose }),
      savePerformance: (frames, score) => {
        const performance: PerformanceData = {
          id: `performance-${Date.now()}`,
          roleId: get().selectedRoleId,
          createdAt: new Date().toISOString(),
          score,
          frames,
        };
        set({ activePerformance: performance });
        return performance;
      },
      resetWorkshop: () =>
        set({
          completedSteps: [],
          colors: {
            face: "#F4E5C0",
            robe: "#C0442D",
            prop: "#D99A2B",
          },
          jointQuality: 0,
          currentPose: defaultPose,
          activePerformance: undefined,
        }),
    }),
    {
      name: "shadow-puppet-game",
      partialize: (state) => ({
        selectedRoleId: state.selectedRoleId,
        completedSteps: state.completedSteps,
        colors: state.colors,
        jointQuality: state.jointQuality,
        activePerformance: state.activePerformance,
      }),
    },
  ),
);
