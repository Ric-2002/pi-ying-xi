// src/store/gameStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultPose } from "@/data/gameData";
import { qualityToGrade } from "@/data/grading";
import {
  CARVE_WEIGHTS,
  CARVE_REGION_IDS,
  JOINT_IDS,
  createEmptyPuppet,
} from "@/types/puppet";
import type {
  CarveRegionId,
  CarveRegionState,
  ColorRegionId,
  JointId,
  PuppetAsset,
} from "@/types/puppet";
import type {
  PerformanceData,
  PerformanceFrameData,
  PuppetPoseData,
  RoleId,
  WorkshopStep,
} from "@/types/game";

export interface WorkshopProgress {
  leather: boolean;
  carving: boolean;
  coloring: boolean;
  jointing: boolean;
  completedCount: number;
  /** 第一个未完成的步骤 id */
  activeStep: WorkshopStep;
}

interface GameState {
  puppet: PuppetAsset | null;
  currentPose: PuppetPoseData;
  activePerformance?: PerformanceData;

  // ===== 写操作(只允许 RoleSelect / Workshop 调用) =====
  initPuppet: (roleId: RoleId) => void;
  setLeatherTranslucency: (translucency: number) => void;
  setCarveRegion: (id: CarveRegionId, data: CarveRegionState) => void;
  recomputeCarvingGrade: () => void;
  updateColoring: (region: ColorRegionId, color: string) => void;
  setJointPiece: (id: JointId, offsetPx: number) => void;
  recomputeJointsGrade: () => void;

  // ===== 通用 =====
  setPose: (pose: PuppetPoseData) => void;
  savePerformance: (
    frames: PerformanceFrameData[],
    score: number,
  ) => PerformanceData;
  resetPuppet: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      puppet: null,
      currentPose: defaultPose,
      activePerformance: undefined,

      initPuppet: (roleId) =>
        set({
          puppet: createEmptyPuppet(roleId),
          currentPose: defaultPose,
          activePerformance: undefined,
        }),

      setLeatherTranslucency: (translucency) =>
        set((state) => {
          if (!state.puppet) return state;
          return {
            puppet: {
              ...state.puppet,
              leather: {
                translucency: Math.max(0, Math.min(1, translucency)),
              },
            },
          };
        }),

      setCarveRegion: (id, data) =>
        set((state) => {
          if (!state.puppet) return state;
          return {
            puppet: {
              ...state.puppet,
              carving: {
                ...state.puppet.carving,
                regions: {
                  ...state.puppet.carving.regions,
                  [id]: data,
                },
              },
            },
          };
        }),

      recomputeCarvingGrade: () =>
        set((state) => {
          if (!state.puppet) return state;
          const regions = state.puppet.carving.regions;
          // 加权平均;未雕的 region 视为 quality=0,但仍参与权重(惩罚跳过)
          let weighted = 0;
          let total = 0;
          for (const id of CARVE_REGION_IDS) {
            const w = CARVE_WEIGHTS[id];
            const r = regions[id];
            weighted += (r.carved ? r.quality : 0) * w;
            total += w;
          }
          const overall = total === 0 ? 0 : weighted / total;
          return {
            puppet: {
              ...state.puppet,
              carving: {
                ...state.puppet.carving,
                overallQuality: overall,
                grade: qualityToGrade(overall),
              },
            },
          };
        }),

      updateColoring: (region, color) =>
        set((state) => {
          if (!state.puppet) return state;
          return {
            puppet: {
              ...state.puppet,
              coloring: { ...state.puppet.coloring, [region]: color },
            },
          };
        }),

      setJointPiece: (id, offsetPx) =>
        set((state) => {
          if (!state.puppet) return state;
          return {
            puppet: {
              ...state.puppet,
              joints: {
                ...state.puppet.joints,
                pieces: {
                  ...state.puppet.joints.pieces,
                  [id]: { offsetPx: Math.max(0, offsetPx) },
                },
              },
            },
          };
        }),

      recomputeJointsGrade: () =>
        set((state) => {
          if (!state.puppet) return state;
          const pieces = state.puppet.joints.pieces;
          const avgOffset =
            JOINT_IDS.reduce((sum, id) => sum + pieces[id].offsetPx, 0) /
            JOINT_IDS.length;
          const overall = 1 - Math.max(0, Math.min(1, avgOffset / 5));
          return {
            puppet: {
              ...state.puppet,
              joints: {
                ...state.puppet.joints,
                overallQuality: overall,
                grade: qualityToGrade(overall),
              },
            },
          };
        }),

      setPose: (pose) => set({ currentPose: pose }),

      savePerformance: (frames, score) => {
        const puppet = get().puppet;
        const performance: PerformanceData = {
          id: `performance-${Date.now()}`,
          roleId: puppet?.roleId ?? "wukong",
          createdAt: new Date().toISOString(),
          score,
          frames,
        };
        set({ activePerformance: performance });
        return performance;
      },

      resetPuppet: () =>
        set({
          puppet: null,
          currentPose: defaultPose,
          activePerformance: undefined,
        }),
    }),
    {
      name: "shadow-puppet-game",
      version: 2,
      migrate: (_persisted, _version) => {
        // demo 阶段不向下兼容,任何旧版本直接重置
        return { puppet: null, activePerformance: undefined };
      },
      partialize: (state) => ({
        puppet: state.puppet,
        activePerformance: state.activePerformance,
      }),
    },
  ),
);

// ===== Selectors =====

/**
 * Workshop step completion derived from puppet state.
 *
 * Known M1 limitations (intentional, fixed by later tasks):
 * - `coloring` flag flips true at puppet init because `createEmptyPuppet` populates
 *   default hex values for all regions. Will be addressed in Task 14/15 when
 *   `createEmptyPuppet` defaults move to empty strings (with ShadowPuppet fallbacks
 *   filling in defaults at render time).
 * - `jointing` flips true the first time `recomputeJointsGrade` runs even with all
 *   offsetPx=0 (perfect assembly produces overallQuality=1). M1 placeholder triggers
 *   it via the "一键完成装关节" button so the flow works; Task 13's real assembly
 *   game requires user-driven recomputes which preserves the intended semantics.
 */
export function useWorkshopProgress(): WorkshopProgress {
  return useGameStore((state) => {
    const p = state.puppet;
    if (!p) {
      return {
        leather: false,
        carving: false,
        coloring: false,
        jointing: false,
        completedCount: 0,
        activeStep: "leather",
      };
    }
    const leather = p.leather.translucency > 0;
    const carving = CARVE_REGION_IDS.some((id) => p.carving.regions[id].carved);
    const coloring = Object.values(p.coloring).some(
      (c) => c !== "" && c != null,
    );
    // jointing 完成 = recomputeJointsGrade 已被调用过(overallQuality 在 createEmptyPuppet 中初始化为 0)
    const jointing = p.joints.overallQuality > 0;

    const flags = { leather, carving, coloring, jointing };
    const order: WorkshopStep[] = ["leather", "carving", "coloring", "jointing"];
    const activeStep = order.find((s) => !flags[s]) ?? "jointing";
    const completedCount = Object.values(flags).filter(Boolean).length;

    return { ...flags, completedCount, activeStep };
  });
}
