# 皮影戏工坊与演出一致性 · 双核玩法重设计 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把工坊四道工序改成"统一资产 PuppetAsset + 共享渲染器 ShadowPuppet + 双核挑战玩法",让选角/工坊/排练/演出/回放看到的是同一具皮影,且工坊里"做得好"真的反映在演出表现上。

**Architecture:** 引入唯一资产对象 `PuppetAsset`(角色 + 制皮 + 雕刻 + 上色 + 关节),由 5 层 SVG 渲染器 `<ShadowPuppet>` 统一呈现。工坊的雕刻(描线稳手)和装关节(对位拼装)是两个真挑战玩法,产出 `quality / offsetPx`,直接驱动演出影偶的清晰度、动作幅度与平滑度。

**Tech Stack:** React 18 + TypeScript + Zustand(persist) + react-router-dom + Tailwind + SVG。**项目无测试框架**(无 vitest / jest),验证手段是 `npm run check`(`tsc -b --noEmit`)和 `npm run dev` 手动验证。

**Spec:** `docs/superpowers/specs/2026-06-19-puppet-redesign-design.md`

---

## 文件结构总览

### 新建
- `src/types/puppet.ts` — 资产模型与评级类型
- `src/data/grading.ts` — 评级阈值表与文案映射
- `src/components/ShadowPuppet.tsx` — 统一渲染器(5 层管线)
- `src/components/puppet/silhouettes/CommonSilhouette.tsx` — 通用人形(M1 占位用)
- `src/components/puppet/silhouettes/WukongSilhouette.tsx`
- `src/components/puppet/silhouettes/TangsengSilhouette.tsx`
- `src/components/puppet/silhouettes/BaigujingSilhouette.tsx`
- `src/components/puppet/silhouettes/BajieSilhouette.tsx`
- `src/components/puppet/silhouettes/ShasengSilhouette.tsx`
- `src/components/puppet/silhouettes/index.ts` — 导出 silhouette 选择函数
- `src/pages/workshop/games/LeatherGame.tsx`
- `src/pages/workshop/games/CarvingGame.tsx`
- `src/pages/workshop/games/ColoringGame.tsx`
- `src/pages/workshop/games/JointingGame.tsx`

### 改写
- `src/store/gameStore.ts` — 重构 state 为 `{puppet, currentPose, activePerformance}`
- `src/types/game.ts` — 删除 `PuppetProgressData`(被 PuppetAsset 取代)
- `src/components/ProgressRail.tsx` — 改用 puppet 派生进度
- `src/pages/RoleSelectPage.tsx` — initPuppet + ShadowPuppet 预览
- `src/pages/WorkshopPage.tsx` — 瘦身为布局 + 步骤路由(< 200 行)
- `src/pages/RehearsalPage.tsx` — 换 ShadowPuppet,按 quality 调动作幅度
- `src/pages/StagePage.tsx` — 换 ShadowPuppet,演出时应用关节抖动 + 神品彩蛋
- `src/pages/ReplayPage.tsx` — 换 ShadowPuppet + 显示资产评级
- `src/pages/Home.tsx` — 若有 hero 影偶则换 ShadowPuppet
- `src/data/gameData.ts` — `roles[]` 增加 `silhouetteKey`,`workshopSteps[]` 文案对齐

### 删除
- `src/components/PuppetFigure.tsx`(被 ShadowPuppet 完全取代)

---

## 全局约束

- **Branch**:已在 `feat/puppet-redesign-spec`,直接在该分支继续。每完成一个任务 `git commit`。
- **TypeScript strict**:`tsc -b` 必须通过,任何 `any` 都要写注释解释。
- **无测试框架**:验证靠类型检查 + 手动跑 `npm run dev` 看页面。
- **persist 版本**:`useGameStore` 的 persist 配置 `version: 2`(原本未指定 ≈ 0),并在 `migrate` 钩子里**直接清空旧数据**(demo 阶段不向下兼容,见 spec §5.1 风险表)。
- **强制约束**:除 `RoleSelectPage` 和 `WorkshopPage` 外,任何页面**不调用** `initPuppet / setCarveRegion / setJointPiece / updateColoring / setLeatherTranslucency / recompute*`,只读 `puppet`(用 selector)。

---

# M1: 地基 — 资产模型 + 共享渲染器最小可用版

**M1 验收**:全流程跑通(选角 → 工坊 → 排练 → 演出 → 回放),所有页面看到的是同一具影偶(暂为通用人形)。`tsc -b --noEmit` 全绿。**问题 2 根因解决**。玩法仍是老的(只是数据接到 puppet 而已)。

---

### Task 1: 新建 PuppetAsset 类型

**Files:**
- Create: `src/types/puppet.ts`

- [ ] **Step 1: 写完整文件**

```typescript
// src/types/puppet.ts
import type { RoleId } from "./game";

export type Grade = "下乘" | "中乘" | "上乘" | "神品";

export type CarveRegionId =
  | "face"
  | "collar"
  | "sash"
  | "skirtL"
  | "skirtR"
  | "ornament";

export type ColorRegionId = "head" | "face" | "robe" | "sash" | "prop";

export type JointId = "head" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

export interface CarveRegionState {
  carved: boolean;
  /** 0~1,该 region 的描线精度;未雕时为 0 */
  quality: number;
}

export interface JointPieceState {
  /** 装配时铜钉偏离穿孔中心的像素距离,0=完美,5+ 视为很差 */
  offsetPx: number;
}

export interface PuppetAsset {
  roleId: RoleId;

  leather: {
    /** 0~1,通透度;默认 0.7(乱点也能拿到的最低值) */
    translucency: number;
  };

  carving: {
    regions: Record<CarveRegionId, CarveRegionState>;
    /** 已雕 region 的加权平均(纹饰权重高),0~1 */
    overallQuality: number;
    grade: Grade;
  };

  coloring: Record<ColorRegionId, string>;

  joints: {
    pieces: Record<JointId, JointPieceState>;
    /** 1 - clamp(avg(offsetPx)/5, 0, 1) */
    overallQuality: number;
    grade: Grade;
  };
}

export const CARVE_REGION_IDS: CarveRegionId[] = [
  "face",
  "collar",
  "sash",
  "skirtL",
  "skirtR",
  "ornament",
];

export const COLOR_REGION_IDS: ColorRegionId[] = [
  "head",
  "face",
  "robe",
  "sash",
  "prop",
];

export const JOINT_IDS: JointId[] = [
  "head",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/** 雕刻 overallQuality 的 region 权重(纹饰最高,腰带最低) */
export const CARVE_WEIGHTS: Record<CarveRegionId, number> = {
  ornament: 1.4,
  face: 1.2,
  skirtL: 1.0,
  skirtR: 1.0,
  collar: 0.9,
  sash: 0.7,
};

/** 默认空 asset 工厂 */
export function createEmptyPuppet(roleId: RoleId): PuppetAsset {
  const carveRegions = Object.fromEntries(
    CARVE_REGION_IDS.map((id) => [id, { carved: false, quality: 0 }]),
  ) as Record<CarveRegionId, CarveRegionState>;

  const jointPieces = Object.fromEntries(
    JOINT_IDS.map((id) => [id, { offsetPx: 0 }]),
  ) as Record<JointId, JointPieceState>;

  return {
    roleId,
    leather: { translucency: 0 },
    carving: {
      regions: carveRegions,
      overallQuality: 0,
      grade: "下乘",
    },
    coloring: {
      head: "#F4E5C0",
      face: "#F4E5C0",
      robe: "#C0442D",
      sash: "#D99A2B",
      prop: "#7A2E18",
    },
    joints: {
      pieces: jointPieces,
      overallQuality: 0,
      grade: "下乘",
    },
  };
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过(无新增错误)

- [ ] **Step 3: Commit**

```bash
git add src/types/puppet.ts
git commit -m "feat(types): add PuppetAsset model with carving/joint/coloring/leather"
```

---

### Task 2: 新建评级阈值与文案

**Files:**
- Create: `src/data/grading.ts`

- [ ] **Step 1: 写完整文件**

```typescript
// src/data/grading.ts
import type { Grade } from "@/types/puppet";

export const GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 0.85, grade: "神品" },
  { min: 0.65, grade: "上乘" },
  { min: 0.4, grade: "中乘" },
  { min: 0.0, grade: "下乘" },
];

export function qualityToGrade(quality: number): Grade {
  const q = Math.max(0, Math.min(1, quality));
  for (const t of GRADE_THRESHOLDS) {
    if (q >= t.min) return t.grade;
  }
  return "下乘";
}

export const GRADE_META: Record<
  Grade,
  { color: string; label: string; flavor: string }
> = {
  神品: {
    color: "#D99A2B",
    label: "神品",
    flavor: "刀刀入纸,光透成戏。",
  },
  上乘: {
    color: "#E5CF95",
    label: "上乘",
    flavor: "线条干净,可登台演。",
  },
  中乘: {
    color: "#A8813A",
    label: "中乘",
    flavor: "尚有毛刺,演出无碍。",
  },
  下乘: {
    color: "#7A2E18",
    label: "下乘",
    flavor: "未尽工艺,影暗刀粗。",
  },
};

/** 是否触发"再来一次?"询问 — grade 低于中乘时为 true */
export function shouldOfferRetry(grade: Grade): boolean {
  return grade === "下乘";
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过

- [ ] **Step 3: Commit**

```bash
git add src/data/grading.ts
git commit -m "feat(grading): add Grade thresholds and meta (下乘/中乘/上乘/神品)"
```

---

### Task 3: 重构 gameStore — puppet 单一资产

**Files:**
- Modify: `src/store/gameStore.ts` (整体替换)
- Modify: `src/types/game.ts` (删除 `PuppetProgressData`)

- [ ] **Step 1: 删除 `src/types/game.ts` 末尾的 `PuppetProgressData`**

把这段从 `src/types/game.ts` 删除:

```typescript
export interface PuppetProgressData {
  roleId: RoleId;
  completedSteps: WorkshopStep[];
  colors: Record<string, string>;
  jointQuality: number;
}
```

- [ ] **Step 2: 把 `src/store/gameStore.ts` 替换为新版**

```typescript
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
          const overall = 1 - Math.min(1, avgOffset / 5);
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
    const jointing = JOINT_IDS.every(
      (id) => p.joints.pieces[id].offsetPx >= 0 && p.joints.overallQuality > 0,
    );

    const flags = { leather, carving, coloring, jointing };
    const order: WorkshopStep[] = ["leather", "carving", "coloring", "jointing"];
    const activeStep = order.find((s) => !flags[s]) ?? "jointing";
    const completedCount = Object.values(flags).filter(Boolean).length;

    return { ...flags, completedCount, activeStep };
  });
}
```

> ⚠️ **注意**:`coloring` 的"是否完成"判定用"任意非空"比较弱,**Task 14 重写 ColoringGame 时再加严**(玩家明确点击过 5 个区域才置 true)。M1 期间这个简化判定能让旧测试路径跑通。

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: **大量错误**(因为 `colors / completedSteps / jointQuality` 等老 API 被多处页面引用)。**这是预期的**——后续任务会逐个修复。

- [ ] **Step 4: Commit(允许失败状态)**

```bash
git add src/store/gameStore.ts src/types/game.ts
git commit -m "refactor(store): replace colors/completedSteps/jointQuality with PuppetAsset

BREAKING: 页面层 import 的 selectedRoleId/colors/completedSteps/jointQuality 等字段
全部失效,后续任务逐个修复。当前 tsc 不绿。"
```

---

### Task 4: 新建 silhouette 占位 + 路由器

**Files:**
- Create: `src/components/puppet/silhouettes/CommonSilhouette.tsx`
- Create: `src/components/puppet/silhouettes/index.ts`

- [ ] **Step 1: 写 CommonSilhouette(M1 期间所有角色都用这个)**

```tsx
// src/components/puppet/silhouettes/CommonSilhouette.tsx
/**
 * 通用人形基础轮廓。M1 期间所有角色共用这个;M2 才会替换成五个角色专属版。
 *
 * 设计契约:
 * - viewBox 固定为 "0 0 100 100",ShadowPuppet 的所有层都按这个坐标系渲染
 * - 头部围绕 (50, 24),躯干中心 (50, 50),左右臂关节 (40, 40) (60, 40),腿根 (45, 65) (55, 65)
 * - 这些坐标作为 SilhouetteGeometry 的契约,M2 各角色 silhouette 必须沿用,否则 ShadowPuppet 的关节层错位
 */
export interface SilhouetteGeometry {
  head: { cx: number; cy: number; rx: number; ry: number };
  torso: { d: string };
  leftArmAnchor: { x: number; y: number };
  rightArmAnchor: { x: number; y: number };
  leftLegAnchor: { x: number; y: number };
  rightLegAnchor: { x: number; y: number };
}

export const COMMON_GEOMETRY: SilhouetteGeometry = {
  head: { cx: 50, cy: 24, rx: 8, ry: 10 },
  torso: { d: "M38 35 C45 31 56 31 63 36 L68 62 C62 73 44 73 34 62 Z" },
  leftArmAnchor: { x: 40, y: 40 },
  rightArmAnchor: { x: 60, y: 40 },
  leftLegAnchor: { x: 45, y: 65 },
  rightLegAnchor: { x: 55, y: 65 },
};

export function CommonSilhouette() {
  // 静态轮廓,只供 ShadowPuppet 内部基础轮廓层使用
  return (
    <g>
      <ellipse
        cx={COMMON_GEOMETRY.head.cx}
        cy={COMMON_GEOMETRY.head.cy}
        rx={COMMON_GEOMETRY.head.rx}
        ry={COMMON_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      <path d={COMMON_GEOMETRY.torso.d} fill="#3A302A" />
    </g>
  );
}
```

- [ ] **Step 2: 写 index.ts(silhouette 选择器)**

```typescript
// src/components/puppet/silhouettes/index.ts
import type { ComponentType } from "react";
import type { RoleId } from "@/types/game";
import { COMMON_GEOMETRY, CommonSilhouette } from "./CommonSilhouette";
import type { SilhouetteGeometry } from "./CommonSilhouette";

export interface SilhouetteEntry {
  Component: ComponentType;
  geometry: SilhouetteGeometry;
}

const REGISTRY: Record<RoleId, SilhouetteEntry> = {
  wukong: { Component: CommonSilhouette, geometry: COMMON_GEOMETRY },
  tangseng: { Component: CommonSilhouette, geometry: COMMON_GEOMETRY },
  baigujing: { Component: CommonSilhouette, geometry: COMMON_GEOMETRY },
  bajie: { Component: CommonSilhouette, geometry: COMMON_GEOMETRY },
  shaseng: { Component: CommonSilhouette, geometry: COMMON_GEOMETRY },
};

/** 给定角色返回其 silhouette 组件与几何契约。M1 期间全部返回 Common */
export function resolveSilhouette(roleId: RoleId): SilhouetteEntry {
  return REGISTRY[roleId];
}

export type { SilhouetteGeometry } from "./CommonSilhouette";
```

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 至少这两个新文件无错误(老错误仍存在,在后续任务修)

- [ ] **Step 4: Commit**

```bash
git add src/components/puppet/silhouettes/
git commit -m "feat(silhouette): add CommonSilhouette + role-to-silhouette registry (M1 stub)"
```

---

### Task 5: 新建 ShadowPuppet 渲染器

**Files:**
- Create: `src/components/ShadowPuppet.tsx`

- [ ] **Step 1: 写完整文件**

```tsx
// src/components/ShadowPuppet.tsx
import { useMemo } from "react";
import { resolveSilhouette } from "@/components/puppet/silhouettes";
import type { CarveRegionId, PuppetAsset } from "@/types/puppet";
import { CARVE_REGION_IDS } from "@/types/puppet";
import type { PuppetPoseData } from "@/types/game";

export type ShadowPuppetView = "select" | "backstage" | "stage" | "replay";

interface ShadowPuppetProps {
  asset: PuppetAsset;
  pose: PuppetPoseData;
  view: ShadowPuppetView;
  /** 工坊雕刻时是否叠加虚线提示(只在 view='backstage' + step==='carving' 时为 true) */
  showCarvingHints?: boolean;
}

// ===== 各 region 在皮影上的"开口"路径(雕了才透光) =====
const CARVE_PATHS: Record<CarveRegionId, string> = {
  face: "M44 21 Q50 18 56 21 L57 28 Q50 31 43 28 Z",
  collar: "M40 33 Q50 31 60 33 L61 36 Q50 38 39 36 Z",
  sash: "M38 47 Q50 45 62 47 L62 50 Q50 53 38 50 Z",
  skirtL: "M39 54 L46 54 L45 65 L40 65 Z",
  skirtR: "M54 54 L61 54 L60 65 L55 65 Z",
  ornament: "M48 24 L52 24 L51 27 L49 27 Z",
};

// ===== Pose 默认值(asset 不带 pose,但渲染器要兜底) =====
function safePose(p: PuppetPoseData | undefined): PuppetPoseData {
  return (
    p ?? {
      body: { x: 50, y: 58, rotation: 0 },
      leftArm: { rotation: 0 },
      rightArm: { rotation: 0 },
      head: { rotation: 0 },
      prop: { rotation: 0 },
    }
  );
}

export function ShadowPuppet({
  asset,
  pose,
  view,
  showCarvingHints = false,
}: ShadowPuppetProps) {
  const { Component: Silhouette, geometry } = resolveSilhouette(asset.roleId);
  const safe = safePose(pose);

  // 镂空层只随 asset 变,缓存以避免每帧重算(spec §5.1 风险点)
  const carveLayer = useMemo(() => {
    return CARVE_REGION_IDS.map((id) => {
      const r = asset.carving.regions[id];
      if (!r.carved) {
        // 未雕 → 实心黑(不透光的代价,spec §1.2 第 3 层)
        return (
          <path
            key={id}
            d={CARVE_PATHS[id]}
            fill="#1a0e08"
            opacity={0.85}
          />
        );
      }
      // 已雕 → 镂空,quality 越高边缘越清晰 + 金边
      const edgeOpacity = 0.3 + r.quality * 0.7;
      return (
        <g key={id}>
          <path d={CARVE_PATHS[id]} fill="none" />
          <path
            d={CARVE_PATHS[id]}
            fill="none"
            stroke="#3a2412"
            strokeWidth={1 - r.quality * 0.5}
            opacity={edgeOpacity}
          />
          {r.quality > 0.85 && (
            <path
              d={CARVE_PATHS[id]}
              fill="none"
              stroke="#D99A2B"
              strokeWidth={0.4}
              opacity={0.6}
            />
          )}
        </g>
      );
    });
  }, [asset.carving.regions]);

  // 雕刻提示虚线层(工坊雕刻时叠加)
  const hintLayer = useMemo(() => {
    if (!showCarvingHints) return null;
    return CARVE_REGION_IDS.map((id) => {
      const r = asset.carving.regions[id];
      if (r.carved) return null;
      return (
        <path
          key={`hint-${id}`}
          d={CARVE_PATHS[id]}
          fill="none"
          stroke="#B3261E"
          strokeWidth={0.6}
          strokeDasharray="2 1.5"
          opacity={0.6}
        />
      );
    });
  }, [showCarvingHints, asset.carving.regions]);

  // 关节抖动幅度 — offsetPx 越大抖得越凶
  const jitterFor = (jointId: keyof PuppetAsset["joints"]["pieces"]) => {
    const off = asset.joints.pieces[jointId].offsetPx;
    if (off <= 1) return 0;
    if (view !== "stage") return 0; // 只在演出时显抖,选角/工坊静态
    return Math.min(2, off * 0.4);
  };

  // 关节动作幅度系数 — 由 joints.overallQuality 决定(spec §2.3 表)
  const armScale =
    asset.joints.overallQuality < 0.4
      ? 0.6
      : asset.joints.overallQuality < 0.65
      ? 0.8
      : asset.joints.overallQuality < 0.85
      ? 1.0
      : 1.1;

  // 视图相关样式
  const viewBg =
    view === "stage" || view === "replay"
      ? "bg-[#F4E5C0]/80"
      : "bg-[#F4E5C0]/90";

  // 通透度 — 制皮 translucency + view 调整
  const baseOpacity = 0.55 + asset.leather.translucency * 0.4;
  const finalOpacity = view === "select" ? 0.85 : baseOpacity;

  return (
    <div
      className={`relative h-full min-h-[360px] w-full overflow-hidden rounded-[2rem] border border-[#D99A2B]/20 ${viewBg} shadow-[inset_0_0_80px_rgba(122,46,24,0.18)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,246,210,0.9),rgba(244,229,192,0.62)_42%,rgba(93,39,24,0.28))]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <filter
            id="puppet-shadow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feDropShadow
              dx="2"
              dy="5"
              stdDeviation="3"
              floodColor="#120B08"
              floodOpacity="0.45"
            />
          </filter>
        </defs>

        <g
          style={{
            transform: `translate(${safe.body.x - 50}px, ${
              safe.body.y - 58
            }px) rotate(${safe.body.rotation}deg)`,
            transformOrigin: "50px 58px",
            opacity: finalOpacity,
            transition: "opacity 0.4s ease",
          }}
          filter="url(#puppet-shadow)"
        >
          {/* Layer 1: 基础轮廓(由 silhouette 定义) */}
          <Silhouette />

          {/* Layer 2: 上色 — 用 coloring 填充躯干 */}
          <path
            d={geometry.torso.d}
            fill={asset.coloring.robe}
            stroke="#3A302A"
            strokeWidth="1.5"
            opacity={0.92}
          />
          <ellipse
            cx={geometry.head.cx}
            cy={geometry.head.cy}
            rx={geometry.head.rx}
            ry={geometry.head.ry}
            fill={asset.coloring.face}
            stroke="#3A302A"
            strokeWidth="1.2"
          />

          {/* Layer 3: 镂空 / 刀痕(asset.carving) */}
          {carveLayer}
          {hintLayer}

          {/* Layer 4 实际由 Layer 2 的 fill 已经完成,这里留空 */}

          {/* Layer 5: 关节 / 姿态 */}
          <g
            style={{
              transform: `rotate(${safe.head.rotation}deg) translate(${jitterFor(
                "head",
              )}px, 0)`,
              transformOrigin: `${geometry.head.cx}px ${geometry.head.cy}px`,
            }}
          />
          <g
            style={{
              transform: `rotate(${
                safe.leftArm.rotation * armScale
              }deg) translate(${jitterFor("leftArm")}px, 0)`,
              transformOrigin: `${geometry.leftArmAnchor.x}px ${geometry.leftArmAnchor.y}px`,
            }}
          >
            <path
              d={`M${geometry.leftArmAnchor.x} ${geometry.leftArmAnchor.y} C31 44 25 51 23 61`}
              stroke={asset.coloring.robe}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx={geometry.leftArmAnchor.x}
              cy={geometry.leftArmAnchor.y}
              r="2.1"
              fill="#D99A2B"
              stroke="#3A302A"
              strokeWidth="0.7"
            />
          </g>
          <g
            style={{
              transform: `rotate(${
                safe.rightArm.rotation * armScale
              }deg) translate(${jitterFor("rightArm")}px, 0)`,
              transformOrigin: `${geometry.rightArmAnchor.x}px ${geometry.rightArmAnchor.y}px`,
            }}
          >
            <path
              d={`M${geometry.rightArmAnchor.x} ${geometry.rightArmAnchor.y} C70 44 76 51 78 61`}
              stroke={asset.coloring.prop}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx={geometry.rightArmAnchor.x}
              cy={geometry.rightArmAnchor.y}
              r="2.1"
              fill="#D99A2B"
              stroke="#3A302A"
              strokeWidth="0.7"
            />
          </g>
          {/* 道具杆 */}
          <g
            style={{
              transform: `rotate(${safe.prop.rotation}deg)`,
              transformOrigin: "76px 58px",
            }}
          >
            <line
              x1="76"
              y1="28"
              x2="76"
              y2="80"
              stroke={asset.coloring.prop}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
          {/* 双腿 */}
          <path
            d={`M${geometry.leftLegAnchor.x} ${geometry.leftLegAnchor.y} L${
              geometry.leftLegAnchor.x - 6
            } 87`}
            stroke="#3A302A"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d={`M${geometry.rightLegAnchor.x} ${geometry.rightLegAnchor.y} L${
              geometry.rightLegAnchor.x + 6
            } 87`}
            stroke="#3A302A"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 这个文件本身无错;老错误依旧。

- [ ] **Step 3: Commit**

```bash
git add src/components/ShadowPuppet.tsx
git commit -m "feat(puppet): add ShadowPuppet — 5-layer shared renderer driven by PuppetAsset"
```

---

### Task 6: 改 RoleSelectPage — initPuppet + ShadowPuppet 预览

**Files:**
- Modify: `src/pages/RoleSelectPage.tsx`

- [ ] **Step 1: 整体替换文件**

```tsx
// src/pages/RoleSelectPage.tsx
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { defaultPose, roles } from "@/data/gameData";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { createEmptyPuppet } from "@/types/puppet";
import type { RoleId } from "@/types/game";

const difficultyText = {
  easy: "入门",
  medium: "进阶",
  hard: "挑战",
};

export function RoleSelectPage() {
  const puppet = useGameStore((state) => state.puppet);
  const initPuppet = useGameStore((state) => state.initPuppet);
  const resetPuppet = useGameStore((state) => state.resetPuppet);

  const selectedRoleId: RoleId = puppet?.roleId ?? "wukong";
  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) ?? roles[0];

  // 选中态资产:已 init 过就用 store 的,否则给一个临时空 asset 仅供预览
  const previewAsset = puppet ?? createEmptyPuppet(selectedRoleId);

  const handleSelect = (roleId: RoleId) => {
    initPuppet(roleId);
  };

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="mb-3 text-sm tracking-[0.4em] text-[#D99A2B]">
            第一步 · 选角
          </p>
          <h1 className="font-serif text-5xl font-black text-[#F4E5C0]">
            选择你要亲手制作的影人
          </h1>
          <p className="mt-4 text-[#F4E5C0]/68">
            每个角色会影响工坊配色、动作提示和最终剧目站位。首轮推荐选择孙悟空,能完整体验武戏动作。
          </p>
          <div className="mt-6 grid gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelect(role.id)}
                className={cn(
                  "rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5",
                  selectedRoleId === role.id
                    ? "border-[#D99A2B]/70 bg-[#D99A2B]/14"
                    : "border-[#F4E5C0]/10 bg-[#F4E5C0]/5 hover:bg-[#F4E5C0]/8",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl text-[#F4E5C0]">
                    {role.name}
                  </span>
                  <span className="rounded-full bg-[#120B08]/60 px-3 py-1 text-xs text-[#D99A2B]">
                    {difficultyText[role.difficulty]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#F4E5C0]/58">{role.title}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <ShadowPuppet asset={previewAsset} pose={defaultPose} view="select" />
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif text-3xl text-[#F4E5C0]">
                {selectedRole.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#F4E5C0]/64">
                {selectedRole.description}
              </p>
              <p className="mt-3 rounded-2xl border border-[#D99A2B]/16 bg-[#D99A2B]/8 p-4 text-sm leading-6 text-[#F4E5C0]/70">
                {selectedRole.culturalNote}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={resetPuppet}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F4E5C0]/16 px-5 py-3 text-sm text-[#F4E5C0] transition hover:bg-[#F4E5C0]/10"
              >
                <RotateCcw className="h-4 w-4" />
                重置
              </button>
              <Link
                to={`/workshop/${selectedRole.id}`}
                onClick={() => {
                  // 进入工坊前确保 puppet 已 init(用户可能点 Link 前未点过角色按钮)
                  if (!puppet || puppet.roleId !== selectedRole.id) {
                    initPuppet(selectedRole.id);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
              >
                去制作
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </GameShell>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 这个文件无错;老错误依旧。

- [ ] **Step 3: Commit**

```bash
git add src/pages/RoleSelectPage.tsx
git commit -m "refactor(role-select): use initPuppet + ShadowPuppet preview"
```

---

### Task 7: 改 ProgressRail — 用 puppet 派生进度

**Files:**
- Read first: `src/components/ProgressRail.tsx`(旧版用 `completedSteps: WorkshopStep[]`)
- Modify: `src/components/ProgressRail.tsx`

- [ ] **Step 1: 读旧文件确认 API**

Run: `cat src/components/ProgressRail.tsx`
确认它接收 `completedSteps: WorkshopStep[]`。

- [ ] **Step 2: 整体替换为新版**

```tsx
// src/components/ProgressRail.tsx
import { Check } from "lucide-react";
import { workshopSteps } from "@/data/gameData";
import { cn } from "@/lib/utils";
import type { WorkshopProgress } from "@/store/gameStore";

interface ProgressRailProps {
  progress: WorkshopProgress;
}

export function ProgressRail({ progress }: ProgressRailProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-[#F4E5C0]/8 bg-[#1C100B]/50 px-4 py-3">
      {workshopSteps.map((step, idx) => {
        const done = progress[step.id];
        const isActive = progress.activeStep === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
                done
                  ? "bg-[#D99A2B]/20 text-[#D99A2B]"
                  : isActive
                  ? "bg-[#F4E5C0]/10 text-[#F4E5C0]"
                  : "text-[#F4E5C0]/40",
              )}
            >
              {done && <Check className="h-3 w-3" />}
              <span>{step.name}</span>
            </div>
            {idx < workshopSteps.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 transition",
                  done ? "bg-[#D99A2B]/40" : "bg-[#F4E5C0]/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 该文件无错;`WorkshopPage` 引用它的位置仍报错,Task 8 修。

- [ ] **Step 4: Commit**

```bash
git add src/components/ProgressRail.tsx
git commit -m "refactor(progress-rail): consume WorkshopProgress from puppet selector"
```

---

### Task 8: 改 WorkshopPage — 瘦身为布局 + 步骤路由(M1 阶段保留旧迷你游戏)

**Files:**
- Modify: `src/pages/WorkshopPage.tsx`

> M1 期间**保留旧的迷你游戏交互**(便于跑通流程),只是把它们的"完成动作"改成调用新的 puppet API。**Task 11~14 才把迷你游戏挪到独立文件并重写**。

- [ ] **Step 1: 整体替换为瘦身版**

```tsx
// src/pages/WorkshopPage.tsx
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ProgressRail } from "@/components/ProgressRail";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles, workshopSteps, defaultPose } from "@/data/gameData";
import { cn } from "@/lib/utils";
import { useGameStore, useWorkshopProgress } from "@/store/gameStore";
import { createEmptyPuppet, CARVE_REGION_IDS, JOINT_IDS } from "@/types/puppet";
import type { RoleId } from "@/types/game";

export function WorkshopPage() {
  const params = useParams();
  const puppet = useGameStore((state) => state.puppet);
  const initPuppet = useGameStore((state) => state.initPuppet);
  const setLeather = useGameStore((state) => state.setLeatherTranslucency);
  const setCarveRegion = useGameStore((state) => state.setCarveRegion);
  const recomputeCarving = useGameStore((state) => state.recomputeCarvingGrade);
  const updateColoring = useGameStore((state) => state.updateColoring);
  const setJointPiece = useGameStore((state) => state.setJointPiece);
  const recomputeJoints = useGameStore((state) => state.recomputeJointsGrade);
  const progress = useWorkshopProgress();

  // 兼容直接进入 /workshop/:roleId 的情况:若无 puppet 或 roleId 不一致 → init
  const roleIdFromUrl = (params.roleId as RoleId | undefined) ?? "wukong";
  if (!puppet || puppet.roleId !== roleIdFromUrl) {
    initPuppet(roleIdFromUrl);
  }
  const activePuppet = puppet ?? createEmptyPuppet(roleIdFromUrl);
  const role = roles.find((r) => r.id === activePuppet.roleId) ?? roles[0];

  // ===== M1 临时迷你游戏(后续 Task 11~14 替换) =====
  const [leatherClicked, setLeatherClicked] = useState(0);

  const handleLeatherTick = useCallback(() => {
    const next = leatherClicked + 1;
    setLeatherClicked(next);
    if (next >= 12) {
      setLeather(0.85); // M1 一律给 0.85;Task 11 改成节奏判定
    }
  }, [leatherClicked, setLeather]);

  const handleCarveAll = useCallback(() => {
    // M1:一键把所有 region 标记为 carved=true,quality=0.7
    for (const id of CARVE_REGION_IDS) {
      setCarveRegion(id, { carved: true, quality: 0.7 });
    }
    recomputeCarving();
  }, [setCarveRegion, recomputeCarving]);

  const handleColorPreset = useCallback(() => {
    // M1:套用角色默认配色
    updateColoring("robe", role.color);
    updateColoring("prop", role.accent);
    updateColoring("head", "#F4E5C0");
    updateColoring("face", "#F4E5C0");
    updateColoring("sash", "#D99A2B");
  }, [role, updateColoring]);

  const handleJointAllPerfect = useCallback(() => {
    // M1:一键把所有关节装到 offsetPx=0
    for (const id of JOINT_IDS) {
      setJointPiece(id, 0);
    }
    recomputeJoints();
  }, [setJointPiece, recomputeJoints]);

  const allDone = progress.completedCount >= 4;

  return (
    <GameShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">
            第二步 · 工坊
          </p>
          <h1 className="font-serif text-4xl font-black text-[#F4E5C0] sm:text-5xl">
            为 {role.name} 制作可动皮影
          </h1>
        </div>
        <Link
          to={`/rehearsal/${role.id}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
            allDone
              ? "bg-[#D99A2B] text-[#120B08] hover:-translate-y-0.5"
              : "border border-[#F4E5C0]/16 text-[#F4E5C0]/40 pointer-events-none",
          )}
        >
          进入排练
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ProgressRail progress={progress} />

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        {/* 左侧:工序列表 */}
        <div className="space-y-4">
          {workshopSteps.map((step) => {
            const done = progress[step.id];
            const isActive = progress.activeStep === step.id;
            return (
              <article
                key={step.id}
                className={cn(
                  "rounded-[1.8rem] border p-5 transition",
                  done
                    ? "border-[#D99A2B]/50 bg-[#D99A2B]/12"
                    : isActive
                    ? "border-[#D99A2B]/40 bg-[#1C100B]/90"
                    : "border-[#F4E5C0]/8 bg-[#1C100B]/50 opacity-50",
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {done && (
                        <Check className="h-4 w-4 flex-shrink-0 text-[#D99A2B]" />
                      )}
                      <h2 className="font-serif text-2xl text-[#F4E5C0]">
                        {step.name}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-[#F4E5C0]/60">
                      {step.craftNote}
                    </p>
                    <p className="mt-2 text-sm text-[#D99A2B]">
                      {step.gameGoal}
                    </p>
                  </div>
                </div>

                {/* M1 占位按钮 — Task 11~14 替换为真实迷你游戏 */}
                {isActive && !done && (
                  <div className="mt-4 border-t border-[#F4E5C0]/8 pt-4">
                    {step.id === "leather" && (
                      <div className="space-y-2">
                        <p className="text-sm text-[#F4E5C0]/70">
                          (M1 占位)点击 12 次模拟绷钉:已点 {leatherClicked} / 12
                        </p>
                        <button
                          type="button"
                          onClick={handleLeatherTick}
                          className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                        >
                          绷一钉
                        </button>
                      </div>
                    )}
                    {step.id === "carving" && (
                      <button
                        type="button"
                        onClick={handleCarveAll}
                        className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                      >
                        (M1 占位)一键完成雕刻
                      </button>
                    )}
                    {step.id === "coloring" && (
                      <button
                        type="button"
                        onClick={handleColorPreset}
                        className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                      >
                        (M1 占位)套用角色配色
                      </button>
                    )}
                    {step.id === "jointing" && (
                      <button
                        type="button"
                        onClick={handleJointAllPerfect}
                        className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                      >
                        (M1 占位)一键完成装关节
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* 右侧:皮影预览 */}
        <aside className="sticky top-6 h-fit">
          <ShadowPuppet
            asset={activePuppet}
            pose={defaultPose}
            view="backstage"
            showCarvingHints={progress.activeStep === "carving"}
          />
          <p className="mt-4 text-sm leading-6 text-[#F4E5C0]/58">
            每完成一步,影偶都会更接近可演状态。装好关节后,你会在幕后学习如何把它「活」起来。
          </p>
          {allDone && (
            <Link
              to={`/rehearsal/${role.id}`}
              className="mt-4 block w-full rounded-full bg-[#D99A2B] py-3 text-center text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
            >
              影人已就绪 · 进入排练 →
            </Link>
          )}
        </aside>
      </section>
    </GameShell>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 该文件无错;Rehearsal/Stage/Replay 还报错。

- [ ] **Step 3: Commit**

```bash
git add src/pages/WorkshopPage.tsx
git commit -m "refactor(workshop): slim page to layout + step router; mini-games stubbed for M1"
```

---

### Task 9: 改 RehearsalPage / StagePage / ReplayPage — 换 ShadowPuppet

**Files:**
- Modify: `src/pages/RehearsalPage.tsx`
- Modify: `src/pages/StagePage.tsx`
- Modify: `src/pages/ReplayPage.tsx`

- [ ] **Step 1: 改 RehearsalPage**

把这两段:
```tsx
import { PuppetFigure } from "@/components/PuppetFigure";
// ...
const colors = useGameStore((state) => state.colors);
// ...
<PuppetFigure role={role} pose={controls.pose} colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }} />
```

替换为:
```tsx
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { createEmptyPuppet } from "@/types/puppet";
// ...
const puppet = useGameStore((state) => state.puppet);
// ...
const asset = puppet ?? createEmptyPuppet(roleId);
<ShadowPuppet asset={asset} pose={controls.pose} view="backstage" />
```

并且把页面里所有 `selectedRoleId` 改为 `puppet?.roleId ?? "wukong"`。

完整新版:

```tsx
// src/pages/RehearsalPage.tsx
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Camera, Keyboard, ShieldCheck } from "lucide-react";
import { ControlPad } from "@/components/ControlPad";
import { GameShell } from "@/components/GameShell";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles } from "@/data/gameData";
import { useCameraPermission } from "@/hooks/useCameraPermission";
import { usePuppetControls } from "@/hooks/usePuppetControls";
import { useGameStore } from "@/store/gameStore";
import { createEmptyPuppet } from "@/types/puppet";
import type { RoleId } from "@/types/game";

const lessons = [
  "右手主杆抬高:皮影身体上移,适合悟空亮相。",
  "左手手杆压低:手臂下沉,适合唐僧合掌或妖影掩面。",
  "双手拉开再定格:形成武戏横扫后的舞台停顿。",
];

export function RehearsalPage() {
  const params = useParams();
  const puppet = useGameStore((state) => state.puppet);
  const setPose = useGameStore((state) => state.setPose);
  const roleId =
    (params.roleId as RoleId | undefined) ?? puppet?.roleId ?? "wukong";
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const asset = puppet ?? createEmptyPuppet(roleId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camera = useCameraPermission();
  const controls = usePuppetControls();

  useEffect(() => {
    setPose(controls.pose);
  }, [controls.pose, setPose]);

  useEffect(() => {
    if (videoRef.current && camera.stream) {
      videoRef.current.srcObject = camera.stream;
    }
  }, [camera.stream]);

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">
            第三步 · 幕后排练
          </p>
          <h1 className="font-serif text-5xl font-black text-[#F4E5C0]">
            用两只手让 {role.name} 活起来
          </h1>
          <p className="mt-4 text-[#F4E5C0]/68">
            摄像头只用于本地预览与手势练习;若授权失败,可以继续用下方双手控制板完成排练和演出。
          </p>

          <div className="mt-6 rounded-[1.8rem] border border-[#D99A2B]/20 bg-[#1C100B]/72 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-[#F4E5C0]/72">
                <ShieldCheck className="h-4 w-4 text-[#D99A2B]" />
                不上传、不保存原始摄像头画面
              </div>
              <button
                type="button"
                onClick={camera.requestCamera}
                className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
              >
                <Camera className="h-4 w-4" />
                开启摄像头
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-[#120B08]">
              {camera.stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full scale-x-[-1] object-cover opacity-70"
                />
              ) : (
                <div className="grid h-full place-items-center text-center text-[#F4E5C0]/58">
                  <div>
                    <Keyboard className="mx-auto mb-3 h-9 w-9 text-[#D99A2B]" />
                    <p>
                      {camera.errorMessage ||
                        "可选择开启摄像头,也可直接使用双手控制板。"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {lessons.map((lesson) => (
              <div
                key={lesson}
                className="rounded-2xl border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-4 text-sm text-[#F4E5C0]/70"
              >
                {lesson}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <ShadowPuppet asset={asset} pose={controls.pose} view="backstage" />
          <div className="mt-5">
            <ControlPad
              leftHand={controls.leftHand}
              rightHand={controls.rightHand}
              onLeftHandChange={controls.updateLeftHand}
              onRightHandChange={controls.updateRightHand}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Link
              to={`/stage/${role.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-6 py-3 font-semibold text-[#120B08] transition hover:-translate-y-0.5"
            >
              进入正式演出
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </section>
    </GameShell>
  );
}
```

- [ ] **Step 2: 改 StagePage(同样的替换思路)**

把 PuppetFigure 替换为 ShadowPuppet,并把 `colors` 字段去除。完整版:

```tsx
// src/pages/StagePage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Pause, Play, RotateCcw } from "lucide-react";
import { ControlPad } from "@/components/ControlPad";
import { GameShell } from "@/components/GameShell";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles } from "@/data/gameData";
import { usePuppetControls } from "@/hooks/usePuppetControls";
import { useScriptTimeline } from "@/hooks/useScriptTimeline";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { createEmptyPuppet } from "@/types/puppet";
import type { PerformanceFrameData, RoleId } from "@/types/game";

export function StagePage() {
  const params = useParams();
  const navigate = useNavigate();
  const puppet = useGameStore((state) => state.puppet);
  const savePerformance = useGameStore((state) => state.savePerformance);
  const roleId =
    (params.roleId as RoleId | undefined) ?? puppet?.roleId ?? "wukong";
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const asset = puppet ?? createEmptyPuppet(roleId);

  const controls = usePuppetControls();
  const [isRunning, setIsRunning] = useState(false);
  const [isFrontView, setIsFrontView] = useState(false);
  const [scoreSamples, setScoreSamples] = useState<number[]>([]);
  const framesRef = useRef<PerformanceFrameData[]>([]);
  const timeline = useScriptTimeline(isRunning);

  useEffect(() => {
    if (!isRunning || timeline.isFinished) {
      return;
    }
    const score = timeline.scorePose(controls.pose);
    setScoreSamples((samples) => [...samples.slice(-80), score]);
    framesRef.current.push({
      t: timeline.elapsedMs,
      pose: controls.pose,
      cueId: timeline.activeCue.id,
    });
  }, [controls.pose, isRunning, timeline]);

  useEffect(() => {
    if (!timeline.isFinished || framesRef.current.length === 0) {
      return;
    }
    const average = Math.round(
      scoreSamples.reduce((sum, s) => sum + s, 0) /
        Math.max(scoreSamples.length, 1),
    );
    const perf = savePerformance(framesRef.current, average);
    setIsRunning(false);
    navigate(`/replay/${perf.id}`);
  }, [navigate, savePerformance, scoreSamples, timeline.isFinished]);

  const currentScore = scoreSamples[scoreSamples.length - 1] ?? 0;

  const restart = () => {
    framesRef.current = [];
    setScoreSamples([]);
    controls.reset();
    setIsRunning(false);
  };

  const smokeActive = isRunning && (timeline.activeCue.smoke ?? false);

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.4em] text-[#D99A2B]">
                第四步 · 正式演出
              </p>
              <h1 className="mt-2 font-serif text-4xl font-black text-[#F4E5C0]">
                《三打白骨精》幕后模式
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsFrontView((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition",
                  isFrontView
                    ? "border-[#D99A2B]/40 bg-[#D99A2B]/15 text-[#D99A2B]"
                    : "border-[#F4E5C0]/16 text-[#F4E5C0]/60 hover:bg-[#F4E5C0]/5",
                )}
              >
                {isFrontView ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {isFrontView ? "幕前" : "幕后"}
              </button>
              <button
                type="button"
                onClick={() => setIsRunning((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
              >
                {isRunning ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? "暂停" : "开演"}
              </button>
              <button
                type="button"
                onClick={restart}
                className="rounded-full border border-[#F4E5C0]/16 px-4 py-3 text-[#F4E5C0] transition hover:bg-[#F4E5C0]/8"
                aria-label="重新开始"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <ShadowPuppet
              asset={asset}
              pose={controls.pose}
              view={isFrontView ? "replay" : "stage"}
            />

            <div
              className="pointer-events-none absolute inset-0 rounded-[2rem] transition-opacity duration-1000"
              style={{
                opacity: smokeActive ? 0.55 : 0,
                background:
                  "radial-gradient(circle at 50% 60%, rgba(244,229,192,0.5), transparent 60%)",
                animation: smokeActive ? "smokeDrift 3s ease-out" : "none",
              }}
            />

            {isRunning && timeline.activeCue.lyric && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
                <div className="rounded-lg bg-[#120B08]/80 px-5 py-2 text-center backdrop-blur-sm">
                  <p className="font-serif text-base tracking-widest text-[#F4E5C0]">
                    {timeline.activeCue.lyric}
                  </p>
                  <p className="mt-0.5 text-xs text-[#D99A2B]/80">
                    —— {timeline.activeCue.scene}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F4E5C0]/10">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${timeline.progress}%`,
                background: "linear-gradient(90deg, #B3261E, #D99A2B)",
              }}
            />
          </div>

          {!isFrontView && (
            <div className="mt-5">
              <ControlPad
                leftHand={controls.leftHand}
                rightHand={controls.rightHand}
                onLeftHandChange={controls.updateLeftHand}
                onRightHandChange={controls.updateRightHand}
              />
            </div>
          )}

          {isFrontView && (
            <p className="mt-4 text-center text-sm text-[#F4E5C0]/40">
              幕前视角 · 操纵杆已隐去 · 按下「幕后」可切回操纵
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-6">
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-[#F4E5C0]/10">
              <div
                className="h-full rounded-full bg-[#D99A2B] transition-all duration-200"
                style={{ width: `${timeline.progress}%` }}
              />
            </div>
            <p className="text-sm text-[#D99A2B]">{timeline.activeCue.scene}</p>
            <h2 className="mt-3 font-serif text-3xl text-[#F4E5C0]">
              {timeline.activeCue.cueText}
            </h2>
            <p className="mt-4 rounded-2xl bg-[#D99A2B]/12 p-4 text-lg font-semibold text-[#F4E5C0]">
              指引:{timeline.activeCue.instruction}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <p className="text-sm text-[#F4E5C0]/58">实时动作匹配</p>
            <p className="mt-2 font-serif text-6xl font-black text-[#D99A2B]">
              {currentScore}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#F4E5C0]/64">
              评分综合节拍、姿态和流畅度。越接近指引姿态,幕前回放越有戏曲定格感。
            </p>
          </div>

          <Link
            to={`/rehearsal/${role.id}`}
            className="block rounded-[1.5rem] border border-[#F4E5C0]/10 p-5 text-center text-sm text-[#F4E5C0]/70 transition hover:bg-[#F4E5C0]/8"
          >
            回到排练,再练一次身段
          </Link>
        </aside>
      </section>

      <style>{`
        @keyframes smokeDrift {
          0% { transform: scale(0.6) translateY(20%); }
          100% { transform: scale(1.8) translateY(-10%); }
        }
      `}</style>
    </GameShell>
  );
}
```

- [ ] **Step 3: 改 ReplayPage**

```tsx
// src/pages/ReplayPage.tsx
import { Link } from "react-router-dom";
import { Home, Play, RotateCcw } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles } from "@/data/gameData";
import { useReplayAnimation } from "@/hooks/useReplayAnimation";
import { useGameStore } from "@/store/gameStore";
import { createEmptyPuppet } from "@/types/puppet";

function getScoreTier(score: number): { label: string; comment: string } {
  if (score >= 92)
    return {
      label: "天人之影",
      comment: "操纵娴熟,节奏极佳。幕前观众目眩神迷。",
    };
  if (score >= 85)
    return { label: "匠心之影", comment: "动作合度,细节可圈。这已是一场好戏。" };
  if (score >= 75)
    return { label: "匠人之影", comment: "已初具韵味,再练几番更佳。" };
  if (score >= 65)
    return { label: "学徒之影", comment: "皮影已随你心动,只是节奏需再磨。" };
  return { label: "初心之影", comment: "哪怕笨拙,这也是你独一无二的一场戏。" };
}

export function ReplayPage() {
  const performance = useGameStore((state) => state.activePerformance);
  const puppet = useGameStore((state) => state.puppet);
  const roleId = performance?.roleId ?? puppet?.roleId ?? "wukong";
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const asset = puppet ?? createEmptyPuppet(roleId);

  const frames = performance?.frames ?? [];
  const replay = useReplayAnimation(frames);
  const tier = getScoreTier(performance?.score ?? 0);

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm tracking-[0.4em] text-[#D99A2B]">
                第五步 · 幕前观看
              </p>
              <h1 className="mt-2 font-serif text-4xl font-black text-[#F4E5C0]">
                这是你刚刚演出的光影
              </h1>
            </div>
          </div>

          <div className="relative">
            <ShadowPuppet asset={asset} pose={replay.pose} view="replay" />

            <div
              className="pointer-events-none absolute inset-0 rounded-[2rem] transition-opacity duration-1000"
              style={{
                opacity: replay.smokeActive ? 0.55 : 0,
                background:
                  "radial-gradient(circle at 50% 60%, rgba(244,229,192,0.5), transparent 60%)",
                animation: replay.smokeActive ? "smokeDrift 3s ease-out" : "none",
              }}
            />

            {replay.currentCue.lyric && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
                <div className="rounded-lg bg-[#120B08]/80 px-5 py-2 text-center backdrop-blur-sm">
                  <p className="font-serif text-base tracking-widest text-[#F4E5C0]">
                    {replay.currentCue.lyric}
                  </p>
                  <p className="mt-0.5 text-xs text-[#D99A2B]/80">
                    —— {replay.currentCue.scene}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F4E5C0]/10">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${replay.progress}%`,
                background: "linear-gradient(90deg, #B3261E, #D99A2B)",
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[#F4E5C0]/40">
              幕前视角 · 操纵杆已隐去
            </p>
            <div className="flex gap-2">
              {replay.isFinished && (
                <button
                  type="button"
                  onClick={replay.restart}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#F4E5C0]/16 px-3 py-1.5 text-xs text-[#F4E5C0]/70 transition hover:bg-[#F4E5C0]/8"
                >
                  <RotateCcw className="h-3 w-3" />
                  再看一遍
                </button>
              )}
              {!replay.isPlaying && !replay.isFinished && (
                <button
                  type="button"
                  onClick={replay.play}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D99A2B] px-3 py-1.5 text-xs font-semibold text-[#120B08] transition hover:-translate-y-0.5"
                >
                  <Play className="h-3 w-3" />
                  播放
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#D99A2B]/12 p-6">
            <p className="text-sm text-[#D99A2B]">本场得分</p>
            <p className="mt-2 font-serif text-7xl font-black text-[#F4E5C0]">
              {performance?.score ?? 0}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#D99A2B]">
              {tier.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#F4E5C0]/70">
              {tier.comment}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <h2 className="font-serif text-2xl text-[#F4E5C0]">片尾寄语</h2>
            <p className="mt-3 text-sm leading-7 text-[#F4E5C0]/66">
              皮影戏的动人之处,是观众只看见幕前的光,幕后却藏着手、眼、唱、念和一代代人的功夫。你刚才亲手让影人动起来,也把这门手艺重新点亮了一次。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/roles"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
            >
              再做一个角色
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F4E5C0]/16 px-5 py-3 text-sm text-[#F4E5C0] transition hover:bg-[#F4E5C0]/8"
            >
              <Home className="h-4 w-4" />
              回到影窗
            </Link>
          </div>
        </aside>
      </section>

      <style>{`
        @keyframes smokeDrift {
          0% { transform: scale(0.6) translateY(20%); }
          100% { transform: scale(1.8) translateY(-10%); }
        }
      `}</style>
    </GameShell>
  );
}
```

- [ ] **Step 4: 类型检查**

Run: `npm run check`
Expected: 现在应该接近全绿,Home.tsx 还可能引用 PuppetFigure。

- [ ] **Step 5: Commit**

```bash
git add src/pages/RehearsalPage.tsx src/pages/StagePage.tsx src/pages/ReplayPage.tsx
git commit -m "refactor(pages): swap PuppetFigure for ShadowPuppet across rehearsal/stage/replay"
```

---

### Task 10: 处理 Home.tsx + 删除 PuppetFigure

**Files:**
- Modify: `src/pages/Home.tsx`(若引用了 PuppetFigure)
- Delete: `src/components/PuppetFigure.tsx`

- [ ] **Step 1: 检查 Home.tsx**

Run: `grep -n "PuppetFigure\|colors\|completedSteps\|jointQuality\|selectedRoleId\|selectRole" src/pages/Home.tsx`

如果有引用,改为 ShadowPuppet(用 `createEmptyPuppet("wukong")` 作占位 asset);如果没引用,跳过。

- [ ] **Step 2: 全局再扫一遍是否还有 PuppetFigure 引用**

Run: `grep -rn "PuppetFigure" src/`
Expected: 只剩 `src/components/PuppetFigure.tsx` 自己。

如果还有别的文件引用,逐个改成 ShadowPuppet 后再继续。

- [ ] **Step 3: 删除 PuppetFigure**

Run: `git rm src/components/PuppetFigure.tsx`

- [ ] **Step 4: 全量类型检查**

Run: `npm run check`
Expected: ✅ 全绿,无任何错误。

- [ ] **Step 5: 手动跑一遍 dev 验证 M1**

Run: `npm run dev`

打开浏览器,验证:
- 选角页能选,右侧预览显示通用人形
- 点"去制作"进入工坊,右侧预览影偶可见
- 工坊四个 M1 占位按钮全部点过后,可以点"进入排练"
- 排练页影偶随双手控制板移动
- 演出能开演、暂停,演完跳到回放
- 回放页能播放和重看

如果都正常 → **M1 完成**。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove PuppetFigure; M1 milestone complete

M1 verification:
- All pages render the same puppet via ShadowPuppet
- tsc -b --noEmit passes
- Full flow Role → Workshop → Rehearsal → Stage → Replay works"
```

---

# M2: 五个角色轮廓

**M2 验收**:选孙悟空和选白骨精,从角色页到演出页**全程长得不一样**。`tsc -b` 通过。

---

### Task 11: 写五个角色专属 silhouette + 路由器更新

**Files:**
- Create: `src/components/puppet/silhouettes/WukongSilhouette.tsx`
- Create: `src/components/puppet/silhouettes/TangsengSilhouette.tsx`
- Create: `src/components/puppet/silhouettes/BaigujingSilhouette.tsx`
- Create: `src/components/puppet/silhouettes/BajieSilhouette.tsx`
- Create: `src/components/puppet/silhouettes/ShasengSilhouette.tsx`
- Modify: `src/components/puppet/silhouettes/index.ts`

> **角色识别要素**(spec §1.2 第 1 层):悟空金箍 / 唐僧袈裟襟 / 白骨精骷髅纹饰 / 八戒长嘴 / 沙僧月牙铲。每个 silhouette 都要遵守 `COMMON_GEOMETRY` 中的关节锚点不变,只在头饰、轮廓、躯干花纹上做差异化。

- [ ] **Step 1: 写 WukongSilhouette**

```tsx
// src/components/puppet/silhouettes/WukongSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const WUKONG_GEOMETRY = COMMON_GEOMETRY;

export function WukongSilhouette() {
  return (
    <g>
      {/* 头部 — 圆而上挑,带金箍 */}
      <ellipse
        cx={WUKONG_GEOMETRY.head.cx}
        cy={WUKONG_GEOMETRY.head.cy}
        rx={WUKONG_GEOMETRY.head.rx}
        ry={WUKONG_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      {/* 金箍 — 横跨头顶的窄环 */}
      <path
        d={`M${WUKONG_GEOMETRY.head.cx - 7} ${WUKONG_GEOMETRY.head.cy - 7}
            Q${WUKONG_GEOMETRY.head.cx} ${WUKONG_GEOMETRY.head.cy - 11}
            ${WUKONG_GEOMETRY.head.cx + 7} ${WUKONG_GEOMETRY.head.cy - 7}`}
        stroke="#D99A2B"
        strokeWidth="1.5"
        fill="none"
      />
      {/* 耳尖向后翘 */}
      <path
        d={`M${WUKONG_GEOMETRY.head.cx - 8} ${WUKONG_GEOMETRY.head.cy - 4}
            L${WUKONG_GEOMETRY.head.cx - 11} ${WUKONG_GEOMETRY.head.cy - 8}`}
        stroke="#3A302A"
        strokeWidth="1.5"
        fill="none"
      />
      {/* 躯干 */}
      <path d={WUKONG_GEOMETRY.torso.d} fill="#3A302A" />
      {/* 武戏腰带突出 */}
      <path
        d="M38 47 Q50 45 62 47 L62 50 Q50 53 38 50 Z"
        fill="#7A2E18"
        opacity="0.7"
      />
    </g>
  );
}
```

- [ ] **Step 2: 写 TangsengSilhouette**

```tsx
// src/components/puppet/silhouettes/TangsengSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const TANGSENG_GEOMETRY = COMMON_GEOMETRY;

export function TangsengSilhouette() {
  return (
    <g>
      {/* 头部 — 圆润,带毗卢帽 */}
      <ellipse
        cx={TANGSENG_GEOMETRY.head.cx}
        cy={TANGSENG_GEOMETRY.head.cy}
        rx={TANGSENG_GEOMETRY.head.rx}
        ry={TANGSENG_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      {/* 毗卢帽 — 头顶上方一片三角 */}
      <path
        d={`M${TANGSENG_GEOMETRY.head.cx - 6} ${TANGSENG_GEOMETRY.head.cy - 9}
            L${TANGSENG_GEOMETRY.head.cx} ${TANGSENG_GEOMETRY.head.cy - 16}
            L${TANGSENG_GEOMETRY.head.cx + 6} ${TANGSENG_GEOMETRY.head.cy - 9} Z`}
        fill="#D99A2B"
      />
      {/* 躯干 — 袈裟斜襟 */}
      <path d={TANGSENG_GEOMETRY.torso.d} fill="#3A302A" />
      <path
        d="M38 35 L55 73"
        stroke="#D99A2B"
        strokeWidth="1.2"
        fill="none"
      />
    </g>
  );
}
```

- [ ] **Step 3: 写 BaigujingSilhouette**

```tsx
// src/components/puppet/silhouettes/BaigujingSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const BAIGUJING_GEOMETRY = COMMON_GEOMETRY;

export function BaigujingSilhouette() {
  return (
    <g>
      {/* 头部 — 略尖,带骷髅纹 */}
      <ellipse
        cx={BAIGUJING_GEOMETRY.head.cx}
        cy={BAIGUJING_GEOMETRY.head.cy}
        rx={BAIGUJING_GEOMETRY.head.rx - 0.5}
        ry={BAIGUJING_GEOMETRY.head.ry + 1}
        fill="#3A302A"
      />
      {/* 双眼眶(骷髅特征) */}
      <circle
        cx={BAIGUJING_GEOMETRY.head.cx - 2.5}
        cy={BAIGUJING_GEOMETRY.head.cy - 1}
        r="1.2"
        fill="#F4E5C0"
        opacity="0.85"
      />
      <circle
        cx={BAIGUJING_GEOMETRY.head.cx + 2.5}
        cy={BAIGUJING_GEOMETRY.head.cy - 1}
        r="1.2"
        fill="#F4E5C0"
        opacity="0.85"
      />
      {/* 飘逸袖摆替代躯干 */}
      <path
        d="M36 35 C40 33 60 33 64 35 L70 64 C66 76 34 76 30 64 Z"
        fill="#3A302A"
      />
      {/* 袖摆纹 */}
      <path
        d="M32 50 Q50 46 68 50"
        stroke="#7A2E18"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
      />
    </g>
  );
}
```

- [ ] **Step 4: 写 BajieSilhouette**

```tsx
// src/components/puppet/silhouettes/BajieSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const BAJIE_GEOMETRY = COMMON_GEOMETRY;

export function BajieSilhouette() {
  return (
    <g>
      {/* 头部 — 圆胖 */}
      <ellipse
        cx={BAJIE_GEOMETRY.head.cx}
        cy={BAJIE_GEOMETRY.head.cy}
        rx={BAJIE_GEOMETRY.head.rx + 1.5}
        ry={BAJIE_GEOMETRY.head.ry - 0.5}
        fill="#3A302A"
      />
      {/* 长嘴向前突出(八戒标志) */}
      <path
        d={`M${BAJIE_GEOMETRY.head.cx + 9} ${BAJIE_GEOMETRY.head.cy + 1}
            Q${BAJIE_GEOMETRY.head.cx + 14} ${BAJIE_GEOMETRY.head.cy + 3}
            ${BAJIE_GEOMETRY.head.cx + 9} ${BAJIE_GEOMETRY.head.cy + 4} Z`}
        fill="#3A302A"
      />
      {/* 双耳大而垂 */}
      <path
        d={`M${BAJIE_GEOMETRY.head.cx - 9} ${BAJIE_GEOMETRY.head.cy - 1}
            Q${BAJIE_GEOMETRY.head.cx - 13} ${BAJIE_GEOMETRY.head.cy + 4}
            ${BAJIE_GEOMETRY.head.cx - 8} ${BAJIE_GEOMETRY.head.cy + 5}`}
        stroke="#3A302A"
        strokeWidth="1.8"
        fill="#3A302A"
      />
      {/* 躯干 — 略胖 */}
      <path
        d="M36 35 C44 30 56 30 64 35 L70 64 C62 75 38 75 30 64 Z"
        fill="#3A302A"
      />
    </g>
  );
}
```

- [ ] **Step 5: 写 ShasengSilhouette**

```tsx
// src/components/puppet/silhouettes/ShasengSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const SHASENG_GEOMETRY = COMMON_GEOMETRY;

export function ShasengSilhouette() {
  return (
    <g>
      {/* 头部 — 方正,蓄须 */}
      <ellipse
        cx={SHASENG_GEOMETRY.head.cx}
        cy={SHASENG_GEOMETRY.head.cy}
        rx={SHASENG_GEOMETRY.head.rx}
        ry={SHASENG_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      {/* 络腮胡 */}
      <path
        d={`M${SHASENG_GEOMETRY.head.cx - 7} ${SHASENG_GEOMETRY.head.cy + 6}
            Q${SHASENG_GEOMETRY.head.cx} ${SHASENG_GEOMETRY.head.cy + 12}
            ${SHASENG_GEOMETRY.head.cx + 7} ${SHASENG_GEOMETRY.head.cy + 6}`}
        stroke="#3A302A"
        strokeWidth="2.5"
        fill="none"
      />
      {/* 头骨佛珠串(沙僧标志,挂脖颈) */}
      <path
        d={`M40 35 Q50 38 60 35`}
        stroke="#D99A2B"
        strokeWidth="0.8"
        fill="none"
      />
      <circle cx="42" cy="35.5" r="0.8" fill="#D99A2B" />
      <circle cx="50" cy="36.8" r="0.8" fill="#D99A2B" />
      <circle cx="58" cy="35.5" r="0.8" fill="#D99A2B" />
      {/* 躯干 */}
      <path d={SHASENG_GEOMETRY.torso.d} fill="#3A302A" />
    </g>
  );
}
```

- [ ] **Step 6: 更新 silhouettes/index.ts 注册表**

```typescript
// src/components/puppet/silhouettes/index.ts
import type { ComponentType } from "react";
import type { RoleId } from "@/types/game";
import { COMMON_GEOMETRY, CommonSilhouette } from "./CommonSilhouette";
import { WUKONG_GEOMETRY, WukongSilhouette } from "./WukongSilhouette";
import { TANGSENG_GEOMETRY, TangsengSilhouette } from "./TangsengSilhouette";
import {
  BAIGUJING_GEOMETRY,
  BaigujingSilhouette,
} from "./BaigujingSilhouette";
import { BAJIE_GEOMETRY, BajieSilhouette } from "./BajieSilhouette";
import { SHASENG_GEOMETRY, ShasengSilhouette } from "./ShasengSilhouette";
import type { SilhouetteGeometry } from "./CommonSilhouette";

export interface SilhouetteEntry {
  Component: ComponentType;
  geometry: SilhouetteGeometry;
}

const REGISTRY: Record<RoleId, SilhouetteEntry> = {
  wukong: { Component: WukongSilhouette, geometry: WUKONG_GEOMETRY },
  tangseng: { Component: TangsengSilhouette, geometry: TANGSENG_GEOMETRY },
  baigujing: { Component: BaigujingSilhouette, geometry: BAIGUJING_GEOMETRY },
  bajie: { Component: BajieSilhouette, geometry: BAJIE_GEOMETRY },
  shaseng: { Component: ShasengSilhouette, geometry: SHASENG_GEOMETRY },
};

// Common 兜底(M1 期间用,M2 之后保留以防 RoleId 扩容)
export { CommonSilhouette, COMMON_GEOMETRY };

export function resolveSilhouette(roleId: RoleId): SilhouetteEntry {
  return REGISTRY[roleId];
}

export type { SilhouetteGeometry } from "./CommonSilhouette";
```

- [ ] **Step 7: 类型检查 + 手动验证**

Run: `npm run check`
Expected: 全绿。

Run: `npm run dev`
打开浏览器,在选角页**逐一切换**孙悟空 / 唐僧 / 白骨精 / 八戒 / 沙僧,确认右侧预览影偶**轮廓和头饰肉眼有别**。

- [ ] **Step 8: Commit**

```bash
git add src/components/puppet/silhouettes/
git commit -m "feat(silhouette): add 5 role-specific silhouettes (Wukong/Tangseng/Baigujing/Bajie/Shaseng)

M2 milestone:
- Wukong: golden headband + warrior sash
- Tangseng: pilu cap + monastic robe lapel
- Baigujing: skull eye sockets + flowing sleeves
- Bajie: long snout + droopy ears
- Shaseng: full beard + bone necklace
All share COMMON_GEOMETRY anchor points."
```

---

# M3: 主难度核 — 雕刻描线玩法

**M3 验收**:雕刻有手感、有失败、有重做钩子;雕得越准演出影偶越通透,可以肉眼对比上乘 vs 下乘版的差别。`tsc -b` 通过。

---

### Task 12: 新建 CarvingGame — 描线稳手流

**Files:**
- Create: `src/pages/workshop/games/CarvingGame.tsx`

> **设计要点**(spec §2.1):
> - 6 条 region 虚线,按推荐顺序激活(face → collar → sash → skirtL → skirtR → ornament),允许跳过(已实现:跳过的 region carved=false)
> - 玩家鼠标按住沿虚线拖动,采样位置离虚线中心线的距离(偏差)和速度
> - 完成一条 region → setCarveRegion(id, {carved:true, quality})
> - 6 条都走过(或玩家点"完成走人")→ recomputeCarvingGrade()
> - grade < 中乘 时弹询问"再来一次?"

- [ ] **Step 1: 写完整文件**

```tsx
// src/pages/workshop/games/CarvingGame.tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { qualityToGrade, GRADE_META, shouldOfferRetry } from "@/data/grading";
import { CARVE_REGION_IDS } from "@/types/puppet";
import type { CarveRegionId, Grade } from "@/types/puppet";
import { cn } from "@/lib/utils";

// ===== 6 条 region 的虚线起点和路径(在 viewBox 0 0 400 300 内) =====
interface CarvePath {
  id: CarveRegionId;
  label: string;
  /** 一系列折线点,玩家要按顺序经过 */
  points: { x: number; y: number }[];
}

const CARVE_PATHS: CarvePath[] = [
  {
    id: "face",
    label: "脸谱",
    points: [
      { x: 170, y: 85 },
      { x: 200, y: 70 },
      { x: 230, y: 85 },
      { x: 235, y: 120 },
      { x: 200, y: 135 },
      { x: 165, y: 120 },
    ],
  },
  {
    id: "collar",
    label: "衣领",
    points: [
      { x: 155, y: 130 },
      { x: 200, y: 120 },
      { x: 245, y: 130 },
      { x: 248, y: 145 },
      { x: 200, y: 155 },
      { x: 152, y: 145 },
    ],
  },
  {
    id: "sash",
    label: "腰带",
    points: [
      { x: 145, y: 180 },
      { x: 200, y: 172 },
      { x: 255, y: 180 },
      { x: 255, y: 195 },
      { x: 200, y: 205 },
      { x: 145, y: 195 },
    ],
  },
  {
    id: "skirtL",
    label: "左裙",
    points: [
      { x: 150, y: 210 },
      { x: 180, y: 210 },
      { x: 175, y: 260 },
      { x: 155, y: 258 },
    ],
  },
  {
    id: "skirtR",
    label: "右裙",
    points: [
      { x: 220, y: 210 },
      { x: 250, y: 210 },
      { x: 245, y: 260 },
      { x: 225, y: 260 },
    ],
  },
  {
    id: "ornament",
    label: "纹饰",
    points: [
      { x: 190, y: 95 },
      { x: 210, y: 95 },
      { x: 208, y: 105 },
      { x: 192, y: 105 },
    ],
  },
];

/** 折线 → SVG path d 字符串 */
function pointsToPath(pts: { x: number; y: number }[]): string {
  return pts
    .map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`))
    .concat(`L${pts[0].x} ${pts[0].y}`) // 闭合
    .join(" ");
}

/** 点 P 到线段 AB 的最近距离 */
function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** 点 P 到整条折线(闭合)的最小距离 */
function distanceToPath(
  px: number,
  py: number,
  pts: { x: number; y: number }[],
): number {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const d = pointSegmentDistance(px, py, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

interface CarvingGameProps {
  onAllDone: (grade: Grade) => void;
}

export function CarvingGame({ onAllDone }: CarvingGameProps) {
  const setCarveRegion = useGameStore((s) => s.setCarveRegion);
  const recomputeCarving = useGameStore((s) => s.recomputeCarvingGrade);
  const puppet = useGameStore((s) => s.puppet);

  // 当前激活的 region(已雕的跳过)
  const activePath = useMemo(() => {
    if (!puppet) return CARVE_PATHS[0];
    return (
      CARVE_PATHS.find(
        (p) => !puppet.carving.regions[p.id]?.carved,
      ) ?? CARVE_PATHS[CARVE_PATHS.length - 1]
    );
  }, [puppet]);

  // 拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const samplesRef = useRef<{ x: number; y: number; t: number; dist: number }[]>(
    [],
  );
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);

  // 评级询问态
  const [pendingRetry, setPendingRetry] = useState<{
    id: CarveRegionId;
    grade: Grade;
    quality: number;
  } | null>(null);

  const toSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const handleDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (pendingRetry) return;
      const p = toSvg(e);
      if (!p) return;
      samplesRef.current = [];
      setIsDragging(true);
      const dist = distanceToPath(p.x, p.y, activePath.points);
      samplesRef.current.push({ x: p.x, y: p.y, t: performance.now(), dist });
      setLivePos(p);
    },
    [activePath, pendingRetry],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging) return;
      const p = toSvg(e);
      if (!p) return;
      const dist = distanceToPath(p.x, p.y, activePath.points);
      samplesRef.current.push({ x: p.x, y: p.y, t: performance.now(), dist });
      setLivePos(p);
    },
    [activePath, isDragging],
  );

  const finishStroke = useCallback(() => {
    setIsDragging(false);
    setLivePos(null);
    const samples = samplesRef.current;
    if (samples.length < 8) return; // 太短,丢弃

    // 偏差均值 → 越小越好。容忍带宽 6px(spec §5.1 提了"简易模式 ±6px")
    const avgDist =
      samples.reduce((s, v) => s + v.dist, 0) / samples.length;
    const distScore = Math.max(0, 1 - avgDist / 6);

    // 速度方差 → 越小越好。计算每对相邻采样的速度
    const speeds: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      const dt = Math.max(1, b.t - a.t);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      speeds.push((Math.hypot(dx, dy) / dt) * 1000); // px/s
    }
    const meanSpeed =
      speeds.reduce((s, v) => s + v, 0) / Math.max(1, speeds.length);
    const variance =
      speeds.reduce((s, v) => s + (v - meanSpeed) ** 2, 0) /
      Math.max(1, speeds.length);
    const stdev = Math.sqrt(variance);
    // 速度方差很小 → 1;>500 px/s 标准差 → 0
    const speedScore = Math.max(0, 1 - stdev / 500);

    const quality = distScore * 0.7 + speedScore * 0.3;
    const grade = qualityToGrade(quality);

    if (shouldOfferRetry(grade)) {
      setPendingRetry({ id: activePath.id, grade, quality });
    } else {
      acceptStroke(activePath.id, quality);
    }
  }, [activePath]);

  const acceptStroke = (id: CarveRegionId, quality: number) => {
    setCarveRegion(id, { carved: true, quality });
    recomputeCarving();

    // 检查是否还有未雕的
    const remaining = CARVE_PATHS.filter(
      (p) => p.id !== id && !puppet?.carving.regions[p.id]?.carved,
    );
    if (remaining.length === 0) {
      // 全部完成,通知上层
      const finalQuality =
        useGameStore.getState().puppet?.carving.overallQuality ?? quality;
      onAllDone(qualityToGrade(finalQuality));
    }
  };

  const handleRetryAccept = () => {
    setPendingRetry(null);
    samplesRef.current = [];
  };

  const handleRetryDecline = () => {
    if (pendingRetry) {
      acceptStroke(pendingRetry.id, pendingRetry.quality);
      setPendingRetry(null);
    }
  };

  const handleSkip = () => {
    // 跳过:把所有未雕 region 标 recompute,接收当前为最终结果
    recomputeCarving();
    const finalQuality =
      useGameStore.getState().puppet?.carving.overallQuality ?? 0;
    onAllDone(qualityToGrade(finalQuality));
  };

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{ background: "#F4E5C0", aspectRatio: "4/3" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 400 300"
          className="absolute inset-0 h-full w-full select-none"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={finishStroke}
          onMouseLeave={() => isDragging && finishStroke()}
          style={{ cursor: pendingRetry ? "default" : "crosshair" }}
        >
          <rect
            x="30"
            y="20"
            width="340"
            height="260"
            fill="#F4E5C0"
            stroke="#7A2E18"
            strokeWidth="2"
          />

          {/* 已完成的 region — 实线深色 */}
          {CARVE_PATHS.filter(
            (p) => puppet?.carving.regions[p.id]?.carved,
          ).map((p) => (
            <path
              key={p.id}
              d={pointsToPath(p.points)}
              fill="rgba(18,11,8,0.35)"
              stroke="#120B08"
              strokeWidth="1.5"
            />
          ))}

          {/* 当前激活 region — 红色虚线 */}
          {!pendingRetry && (
            <path
              d={pointsToPath(activePath.points)}
              fill="none"
              stroke="rgba(179,38,30,0.6)"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
          )}

          {/* 未激活 region — 暗淡 */}
          {CARVE_PATHS.filter(
            (p) =>
              !puppet?.carving.regions[p.id]?.carved && p.id !== activePath.id,
          ).map((p) => (
            <path
              key={p.id}
              d={pointsToPath(p.points)}
              fill="none"
              stroke="rgba(122,46,24,0.2)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ))}

          {/* 拖动时,绘制采样点形成的刀痕(偏差小=细深,偏差大=粗浅) */}
          {samplesRef.current.length > 1 &&
            samplesRef.current.map((s, i) => {
              if (i === 0) return null;
              const prev = samplesRef.current[i - 1];
              const w = Math.max(0.4, 2.5 - s.dist * 0.4);
              const op = Math.max(0.25, 1 - s.dist / 8);
              return (
                <line
                  key={i}
                  x1={prev.x}
                  y1={prev.y}
                  x2={s.x}
                  y2={s.y}
                  stroke="#3a2412"
                  strokeWidth={w}
                  opacity={op}
                />
              );
            })}

          {/* 实时刻刀光标 */}
          {livePos && (
            <circle
              cx={livePos.x}
              cy={livePos.y}
              r="3"
              fill="none"
              stroke="#D99A2B"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* 评级询问浮层 */}
        {pendingRetry && (
          <div className="absolute inset-0 grid place-items-center bg-[#120B08]/80 backdrop-blur-sm">
            <div className="rounded-2xl border border-[#D99A2B]/40 bg-[#1C100B] p-6 text-center max-w-[300px]">
              <p
                className="font-serif text-2xl"
                style={{ color: GRADE_META[pendingRetry.grade].color }}
              >
                {GRADE_META[pendingRetry.grade].label}
              </p>
              <p className="mt-2 text-sm text-[#F4E5C0]/70">
                {GRADE_META[pendingRetry.grade].flavor}
              </p>
              <p className="mt-3 text-xs text-[#F4E5C0]/50">
                可以挽救你的影人吗?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetryAccept}
                  className="flex-1 rounded-full bg-[#D99A2B] py-2 text-sm font-semibold text-[#120B08]"
                >
                  再来一次
                </button>
                <button
                  type="button"
                  onClick={handleRetryDecline}
                  className="flex-1 rounded-full border border-[#F4E5C0]/30 py-2 text-sm text-[#F4E5C0]"
                >
                  接受 · 继续
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-[#D99A2B]">
          当前:{activePath.label} — 按住鼠标沿虚线一笔到底
        </p>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-full border border-[#F4E5C0]/16 px-3 py-1 text-xs text-[#F4E5C0]/60 transition hover:bg-[#F4E5C0]/8"
        >
          完成走人(跳过剩余)
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CARVE_PATHS.map((p) => {
          const r = puppet?.carving.regions[p.id];
          const carved = r?.carved ?? false;
          return (
            <span
              key={p.id}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                carved
                  ? "border-[#D99A2B]/50 bg-[#D99A2B]/15 text-[#D99A2B]"
                  : "border-[#F4E5C0]/15 text-[#F4E5C0]/40",
              )}
            >
              {carved ? <Check className="inline h-3 w-3 mr-1" /> : null}
              {p.label}
              {carved && r ? ` · ${qualityToGrade(r.quality)}` : ""}
            </span>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>:皮影雕刻讲究推刀、拉刀、冲孔并用,一件影人常需三千余刀,刀刀不可错。
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 在 WorkshopPage 接入 CarvingGame**

把 `src/pages/WorkshopPage.tsx` 中"M1 占位 - carving"那一段替换:

```tsx
{step.id === "carving" && (
  <CarvingGame
    onAllDone={(grade) => {
      // M3:carving 这一步算完成 — 由 progress.activeStep 自动推进
      void grade;
    }}
  />
)}
```

并 import:
```tsx
import { CarvingGame } from "./workshop/games/CarvingGame";
```

> 同时:**删掉 WorkshopPage 中的 `handleCarveAll` 和占位按钮**(它已被 CarvingGame 取代)。

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 4: 手动验证**

Run: `npm run dev`
- 进入工坊,跳过制皮(M1 占位按钮一键完成),进入雕刻
- 沿虚线慢且稳地拖 → 应得"上乘"或"神品",不弹询问
- 故意乱画一通 → 应弹"再来一次"询问;选"再来"复位,选"接受"继续
- 6 条 region 都做完 → 自动进入下一步(上色)
- 右侧 ShadowPuppet 预览能看到已雕的 region 出现镂空(carved=true 的 region 不再是黑块)

- [ ] **Step 5: Commit**

```bash
git add src/pages/workshop/games/CarvingGame.tsx src/pages/WorkshopPage.tsx
git commit -m "feat(carving): trace-line stroke game with deviation+speed grading

M3 milestone:
- 6 regions (face/collar/sash/skirtL/skirtR/ornament), activated in order
- Distance to dashed path (weight 0.7) + speed stdev (0.3) → quality 0~1
- 下乘 grade triggers retry prompt (non-blocking)
- 'Skip remaining' button always available
- Carved regions update ShadowPuppet preview live"
```

---

# M4: 次难度核 — 关节对位玩法

**M4 验收**:关节装得准演出动作幅度大且顺,装歪了演出真的会肉眼可见地抖。`tsc -b` 通过。

---

### Task 13: 新建 JointingGame — 对位拼装流

**Files:**
- Create: `src/pages/workshop/games/JointingGame.tsx`

> **设计要点**(spec §2.2):
> - 5 个待装部件:头、左臂、右臂、左腿、右腿
> - 部件铜钉 → 躯干穿孔的对位拖拽
> - 穿孔位置每次拖动开始后微飘 ±3 px
> - 8 px 内磁吸提示(变金),不自动吸附
> - 装完进入"试拉":自动摆 pose,offsetPx > 3 的关节肉眼抖
> - 单关节重装入口

- [ ] **Step 1: 写完整文件**

```tsx
// src/pages/workshop/games/JointingGame.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { qualityToGrade, GRADE_META, shouldOfferRetry } from "@/data/grading";
import { JOINT_IDS } from "@/types/puppet";
import type { Grade, JointId } from "@/types/puppet";
import { cn } from "@/lib/utils";

interface AnchorPos {
  x: number;
  y: number;
}

const ANCHOR_BASE: Record<JointId, AnchorPos> = {
  head: { x: 200, y: 60 },
  leftArm: { x: 160, y: 130 },
  rightArm: { x: 240, y: 130 },
  leftLeg: { x: 180, y: 230 },
  rightLeg: { x: 220, y: 230 },
};

const PIECE_LABEL: Record<JointId, string> = {
  head: "头",
  leftArm: "左臂",
  rightArm: "右臂",
  leftLeg: "左腿",
  rightLeg: "右腿",
};

// 部件起始位置(散在工作台周边)
const PIECE_START: Record<JointId, AnchorPos> = {
  head: { x: 80, y: 50 },
  leftArm: { x: 60, y: 150 },
  rightArm: { x: 320, y: 150 },
  leftLeg: { x: 80, y: 240 },
  rightLeg: { x: 320, y: 240 },
};

interface JointingGameProps {
  onAllDone: (grade: Grade) => void;
}

export function JointingGame({ onAllDone }: JointingGameProps) {
  const setJointPiece = useGameStore((s) => s.setJointPiece);
  const recomputeJoints = useGameStore((s) => s.recomputeJointsGrade);
  const puppet = useGameStore((s) => s.puppet);

  // 每个部件:已安装 / 未安装 / 当前位置 / 当前飘移后的穿孔位置
  const [piecePos, setPiecePos] = useState<Record<JointId, AnchorPos>>(() => ({
    ...PIECE_START,
  }));
  const [installed, setInstalled] = useState<
    Partial<Record<JointId, { offsetPx: number }>>
  >({});
  const [anchorJitter, setAnchorJitter] = useState<
    Record<JointId, AnchorPos>
  >(() => ({ ...ANCHOR_BASE }));

  const dragRef = useRef<{ id: JointId; offsetX: number; offsetY: number } | null>(
    null,
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [phase, setPhase] = useState<"assembling" | "trial" | "done">(
    "assembling",
  );
  const [pendingRetry, setPendingRetry] = useState<{ grade: Grade } | null>(
    null,
  );

  // 重新生成穿孔飘移(每次开始拖动一个新部件时调用)
  const reJitterAnchor = useCallback((id: JointId) => {
    const base = ANCHOR_BASE[id];
    setAnchorJitter((prev) => ({
      ...prev,
      [id]: {
        x: base.x + (Math.random() - 0.5) * 6,
        y: base.y + (Math.random() - 0.5) * 6,
      },
    }));
  }, []);

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const handlePieceDown = (id: JointId, e: React.MouseEvent) => {
    if (installed[id] || phase !== "assembling") return;
    const p = toSvg(e.clientX, e.clientY);
    const cur = piecePos[id];
    dragRef.current = { id, offsetX: p.x - cur.x, offsetY: p.y - cur.y };
    reJitterAnchor(id);
    e.preventDefault();
  };

  // 全局 mousemove / mouseup
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const p = toSvg(e.clientX, e.clientY);
      setPiecePos((prev) => ({
        ...prev,
        [drag.id]: { x: p.x - drag.offsetX, y: p.y - drag.offsetY },
      }));
    };
    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const p = toSvg(e.clientX, e.clientY);
      const final = { x: p.x - drag.offsetX, y: p.y - drag.offsetY };
      const anchor = anchorJitter[drag.id];
      const dist = Math.hypot(final.x - anchor.x, final.y - anchor.y);

      if (dist < 18) {
        // 视为装上(可装范围,松一点;但 offsetPx 直接进 store)
        const offsetPx = dist;
        setInstalled((prev) => ({ ...prev, [drag.id]: { offsetPx } }));
        // 把部件吸到锚点(松脆动画用 CSS transition)
        setPiecePos((prev) => ({ ...prev, [drag.id]: { ...anchor } }));
        setJointPiece(drag.id, offsetPx);
      } else {
        // 没装上,弹回起点附近
        setPiecePos((prev) => ({ ...prev, [drag.id]: PIECE_START[drag.id] }));
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [anchorJitter, setJointPiece]);

  const allInstalled = JOINT_IDS.every((id) => installed[id]);

  // 5 个都装完 → 进入试拉
  useEffect(() => {
    if (allInstalled && phase === "assembling") {
      setPhase("trial");
      recomputeJoints();
    }
  }, [allInstalled, phase, recomputeJoints]);

  const handleReinstall = (id: JointId) => {
    setInstalled((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPiecePos((prev) => ({ ...prev, [id]: PIECE_START[id] }));
    setPhase("assembling");
  };

  const handleConfirmAssembly = () => {
    const overallQ = puppet?.joints.overallQuality ?? 0;
    const grade = qualityToGrade(overallQ);
    if (shouldOfferRetry(grade)) {
      setPendingRetry({ grade });
    } else {
      setPhase("done");
      onAllDone(grade);
    }
  };

  const handleRetryAll = () => {
    setInstalled({});
    setPiecePos({ ...PIECE_START });
    setPhase("assembling");
    setPendingRetry(null);
  };

  const handleAcceptCurrent = () => {
    if (!pendingRetry) return;
    setPhase("done");
    onAllDone(pendingRetry.grade);
    setPendingRetry(null);
  };

  // 试拉时的演示 pose 帧
  const [trialPhase, setTrialPhase] = useState(0);
  useEffect(() => {
    if (phase !== "trial") return;
    const t = setInterval(() => {
      setTrialPhase((p) => (p + 1) % 4);
    }, 600);
    return () => clearInterval(t);
  }, [phase]);

  const armRot = trialPhase === 0 ? 0 : trialPhase === 1 ? -30 : trialPhase === 2 ? 0 : 30;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{ background: "#F4E5C0", aspectRatio: "4/3" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 400 300"
          className="absolute inset-0 h-full w-full select-none"
        >
          {/* 工作台底色 */}
          <rect
            x="20"
            y="20"
            width="360"
            height="260"
            fill="#F4E5C0"
            stroke="#7A2E18"
            strokeWidth="2"
          />

          {/* 躯干(中心) */}
          <path
            d="M180 80 Q200 70 220 80 L228 220 Q200 234 172 220 Z"
            fill="#7A2E18"
            opacity="0.55"
          />

          {/* 穿孔(目标位置) */}
          {phase === "assembling" &&
            JOINT_IDS.filter((id) => !installed[id]).map((id) => {
              const a = anchorJitter[id];
              const isDragging = dragRef.current?.id === id;
              const piece = piecePos[id];
              const dist = Math.hypot(piece.x - a.x, piece.y - a.y);
              const close = isDragging && dist < 8;
              return (
                <circle
                  key={`hole-${id}`}
                  cx={a.x}
                  cy={a.y}
                  r="6"
                  fill="none"
                  stroke={close ? "#D99A2B" : "#3a2412"}
                  strokeWidth={close ? 2.5 : 1.5}
                />
              );
            })}

          {/* 已装部件 */}
          {JOINT_IDS.filter((id) => installed[id]).map((id) => {
            const a = ANCHOR_BASE[id];
            const off = installed[id]!.offsetPx;
            const trialJitter =
              phase === "trial" && off > 3
                ? Math.sin(performance.now() / 80 + a.x) * Math.min(2, off * 0.4)
                : 0;
            // 试拉阶段,胳膊摆动
            const rot =
              phase === "trial" && (id === "leftArm" || id === "rightArm")
                ? id === "leftArm"
                  ? armRot
                  : -armRot
                : 0;
            return (
              <g
                key={id}
                style={{
                  transform: `translate(${trialJitter}px, 0) rotate(${rot}deg)`,
                  transformOrigin: `${a.x}px ${a.y}px`,
                  transition: "transform 0.4s ease",
                }}
              >
                <circle
                  cx={a.x}
                  cy={a.y}
                  r="5"
                  fill="#D99A2B"
                  stroke="#3a2412"
                  strokeWidth="1.2"
                />
                <text
                  x={a.x}
                  y={a.y + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#3a2412"
                >
                  {PIECE_LABEL[id]}
                </text>
              </g>
            );
          })}

          {/* 待装部件(可拖) */}
          {phase === "assembling" &&
            JOINT_IDS.filter((id) => !installed[id]).map((id) => {
              const p = piecePos[id];
              return (
                <g
                  key={id}
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => handlePieceDown(id, e)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="10"
                    fill="#D99A2B"
                    stroke="#7A2E18"
                    strokeWidth="1.5"
                  />
                  <circle cx={p.x} cy={p.y} r="3" fill="#3a2412" />
                  <text
                    x={p.x}
                    y={p.y + 24}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#7A2E18"
                  >
                    {PIECE_LABEL[id]}
                  </text>
                </g>
              );
            })}
        </svg>

        {pendingRetry && (
          <div className="absolute inset-0 grid place-items-center bg-[#120B08]/80 backdrop-blur-sm">
            <div className="rounded-2xl border border-[#D99A2B]/40 bg-[#1C100B] p-6 text-center max-w-[320px]">
              <p
                className="font-serif text-2xl"
                style={{ color: GRADE_META[pendingRetry.grade].color }}
              >
                关节 · {GRADE_META[pendingRetry.grade].label}
              </p>
              <p className="mt-2 text-sm text-[#F4E5C0]/70">
                {GRADE_META[pendingRetry.grade].flavor}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetryAll}
                  className="flex-1 rounded-full bg-[#D99A2B] py-2 text-sm font-semibold text-[#120B08]"
                >
                  整套重装
                </button>
                <button
                  type="button"
                  onClick={handleAcceptCurrent}
                  className="flex-1 rounded-full border border-[#F4E5C0]/30 py-2 text-sm text-[#F4E5C0]"
                >
                  接受 · 继续
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {phase === "assembling" && (
        <p className="text-center text-sm text-[#D99A2B]">
          拖动金色部件,把铜钉对准躯干上的深色穿孔(8 px 内会有金色提示)
        </p>
      )}

      {phase === "trial" && (
        <div className="space-y-3">
          <p className="text-center text-sm text-[#D99A2B]">
            试拉中 — 偏差 &gt; 3 px 的关节会肉眼可见地抖
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {JOINT_IDS.map((id) => {
              const inst = installed[id];
              const off = inst?.offsetPx ?? 0;
              const bad = off > 3;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleReinstall(id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
                    bad
                      ? "border-[#B3261E]/60 bg-[#B3261E]/15 text-[#F4E5C0]"
                      : "border-[#D99A2B]/40 text-[#D99A2B]",
                  )}
                >
                  {!bad && <Check className="h-3 w-3" />}
                  {bad && <RotateCcw className="h-3 w-3" />}
                  {PIECE_LABEL[id]} · {off.toFixed(1)} px
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleConfirmAssembly}
            className="block w-full rounded-full bg-[#D99A2B] py-3 text-sm font-semibold text-[#120B08]"
          >
            确认装配 · 下一步
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>:皮影以铜钉或丝线串联关节,典型影人有 11~13 个关节,由主杆控身形,手杆控手臂。
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 在 WorkshopPage 接入 JointingGame**

把 WorkshopPage 中"M1 占位 - jointing"那一段替换:

```tsx
{step.id === "jointing" && (
  <JointingGame onAllDone={(grade) => void grade} />
)}
```

并 import:
```tsx
import { JointingGame } from "./workshop/games/JointingGame";
```

删掉 `handleJointAllPerfect`。

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 4: 手动验证**

Run: `npm run dev`
- 进入工坊,前面步骤跳过(M1 占位 / CarvingGame),进入装关节
- 5 个金色部件可拖动,拖向躯干周围深色穿孔
- 8 px 内穿孔变金 → 提示"快对上了"
- 距离 < 18 px 松手 → 装上;不在范围弹回起点
- 装完 5 个 → 自动进入"试拉",看到影偶手臂摆动
- offsetPx > 3 的关节看到抖动 + 红色标识
- 点单个关节 chip → 重装该关节
- 点"确认装配" → grade < 中乘 弹整套重装,>= 中乘 直接进下一步

- [ ] **Step 5: Commit**

```bash
git add src/pages/workshop/games/JointingGame.tsx src/pages/WorkshopPage.tsx
git commit -m "feat(jointing): peg-alignment assembly game with trial-pull verification

M4 milestone:
- 5 pieces (head/left+rightArm/left+rightLeg) drag onto torso anchors
- Anchor jitters ±3px on each new drag, magnetic hint within 8px
- offsetPx written to puppet.joints; recomputeJointsGrade after assembly
- Trial-pull phase: bad joints (>3px) visibly shake during animated pose
- Per-joint reinstall button + 'retry all' on overall <中乘"
```

---

# M5: 制皮节奏 + 上色 + 神品彩蛋 + 评级显示

**M5 验收**:全流程仪式感闭环,神品玩家有专属彩蛋。`tsc -b` 通过。

---

### Task 14: 新建 LeatherGame 与 ColoringGame(M5 重构)

**Files:**
- Create: `src/pages/workshop/games/LeatherGame.tsx`
- Create: `src/pages/workshop/games/ColoringGame.tsx`
- Modify: `src/pages/WorkshopPage.tsx`

- [ ] **Step 1: 写 LeatherGame**

```tsx
// src/pages/workshop/games/LeatherGame.tsx
import { useCallback, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";

const TACK_COUNT = 12;

function generateTackPoints(): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < TACK_COUNT; i++) {
    const a = (i / TACK_COUNT) * Math.PI * 2 + 0.3;
    pts.push({
      x: 200 + Math.cos(a) * 110,
      y: 150 + Math.sin(a) * 80,
    });
  }
  return pts;
}

interface LeatherGameProps {
  onDone: () => void;
}

export function LeatherGame({ onDone }: LeatherGameProps) {
  const setLeather = useGameStore((s) => s.setLeatherTranslucency);
  const tackPoints = useRef(generateTackPoints());
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const lastClickTimeRef = useRef<number>(0);
  const intervalsRef = useRef<number[]>([]);

  const handleClick = useCallback(
    (i: number) => {
      if (clicked.has(i)) return;
      const now = performance.now();
      if (lastClickTimeRef.current > 0) {
        intervalsRef.current.push(now - lastClickTimeRef.current);
      }
      lastClickTimeRef.current = now;

      const next = new Set(clicked);
      next.add(i);
      setClicked(next);

      if (next.size === TACK_COUNT) {
        // 节奏判定:间隔标准差越小越好,且全部 < 1.5s
        const intervals = intervalsRef.current;
        const allTimely = intervals.every((iv) => iv < 1500);
        if (allTimely && intervals.length > 0) {
          const mean =
            intervals.reduce((s, v) => s + v, 0) / intervals.length;
          const variance =
            intervals.reduce((s, v) => s + (v - mean) ** 2, 0) /
            intervals.length;
          const stdev = Math.sqrt(variance);
          // stdev < 200ms → 1.0;stdev > 600ms → 0.7
          const t = Math.max(0.7, 1 - (stdev - 200) / 1500);
          setLeather(Math.min(1, t));
        } else {
          setLeather(0.7);
        }
        setTimeout(onDone, 400);
      }
    },
    [clicked, setLeather, onDone],
  );

  const remaining = TACK_COUNT - clicked.size;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #F4E5C0, #C9B68C 55%, #7A2E18 100%)",
          aspectRatio: "4/3",
        }}
      >
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <rect
            x="20"
            y="20"
            width="360"
            height="260"
            fill="none"
            stroke="#3a2412"
            strokeWidth="3"
          />
          <text
            x="200"
            y="160"
            textAnchor="middle"
            fontFamily="serif"
            fontSize="22"
            fill="#7A2E18"
            opacity="0.3"
          >
            牛 皮 · 待 绷
          </text>
          {tackPoints.current.map((pt, i) => (
            <g
              key={i}
              onClick={() => handleClick(i)}
              style={{ cursor: clicked.has(i) ? "default" : "pointer" }}
            >
              {clicked.has(i) ? (
                <>
                  <circle cx={pt.x} cy={pt.y} r={5} fill="#3a2412" />
                  <circle cx={pt.x} cy={pt.y} r={2} fill="#D99A2B" />
                </>
              ) : (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={8}
                  fill="#B3261E"
                  opacity={0.85}
                  stroke="#7A2E18"
                  strokeWidth={1.5}
                />
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0
          ? `请按节奏依次点击红点,模拟绷钉 — 还剩 ${remaining} 处`
          : "✓ 牛皮绷展完成!"}
      </p>
      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>:选皮多用黄牛皮(约3~5岁),浸泡3~4日去毛,往返刮皮3次后绷于木框上阴干。
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 ColoringGame**

```tsx
// src/pages/workshop/games/ColoringGame.tsx
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { COLOR_REGION_IDS } from "@/types/puppet";
import type { ColorRegionId } from "@/types/puppet";
import { cn } from "@/lib/utils";

const PALETTE = [
  { name: "朱砂", color: "#B3261E" },
  { name: "赭石", color: "#7A2E18" },
  { name: "藤黄", color: "#D99A2B" },
  { name: "石青", color: "#1D6F7A" },
  { name: "石绿", color: "#2F6B3E" },
  { name: "象牙白", color: "#F4E5C0" },
  { name: "烟墨", color: "#3A302A" },
  { name: "胭脂", color: "#8A1C33" },
  { name: "泥金", color: "#A8813A" },
  { name: "靛蓝", color: "#2A3E66" },
];

const REGION_LABEL: Record<ColorRegionId, string> = {
  head: "头",
  face: "脸",
  robe: "身体",
  sash: "腰带",
  prop: "道具",
};

interface ColoringGameProps {
  onDone: () => void;
}

export function ColoringGame({ onDone }: ColoringGameProps) {
  const updateColoring = useGameStore((s) => s.updateColoring);
  const puppet = useGameStore((s) => s.puppet);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color);
  const [colored, setColored] = useState<Set<ColorRegionId>>(new Set());

  // 同步已有颜色(玩家可能从 RoleSelect 带过来默认色,但要求他主动点击)
  useEffect(() => {
    // M5:严格判定 — 必须每个 region 被主动点过才算完成
  }, []);

  const handleColor = (id: ColorRegionId) => {
    updateColoring(id, selectedColor);
    setColored((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (next.size === COLOR_REGION_IDS.length) {
        setTimeout(onDone, 400);
      }
      return next;
    });
  };

  const remaining = COLOR_REGION_IDS.length - colored.size;
  const getFill = (id: ColorRegionId) => puppet?.coloring[id] ?? "#F4E5C0";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((p) => (
          <button
            key={p.color}
            type="button"
            title={p.name}
            onClick={() => setSelectedColor(p.color)}
            className={cn(
              "h-9 w-9 rounded-full border-2 transition hover:scale-110",
              selectedColor === p.color
                ? "border-[#F4E5C0] ring-2 ring-[#D99A2B] ring-offset-1 ring-offset-[#1C100B]"
                : "border-[#5a411d]",
            )}
            style={{ backgroundColor: p.color }}
            aria-label={p.name}
          />
        ))}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{ background: "#F4E5C0", aspectRatio: "4/3" }}
      >
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <rect
            x="20"
            y="20"
            width="360"
            height="260"
            fill="#F4E5C0"
            stroke="#7A2E18"
            strokeWidth="2"
          />
          <ellipse
            cx="200"
            cy="95"
            rx="32"
            ry="38"
            fill={getFill("head")}
            stroke="#3a2412"
            strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("head")}
          />
          <path
            d="M180 90 Q200 80 220 90 Q218 115 200 120 Q182 115 180 90 Z"
            fill={getFill("face")}
            stroke="#3a2412"
            strokeWidth="1"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("face")}
          />
          <path
            d="M155 135 Q200 125 245 135 L255 245 Q200 265 145 245 Z"
            fill={getFill("robe")}
            stroke="#3a2412"
            strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("robe")}
          />
          <path
            d="M150 185 Q200 178 250 185 L252 200 Q200 210 148 200 Z"
            fill={getFill("sash")}
            stroke="#3a2412"
            strokeWidth="1"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("sash")}
          />
          <rect
            x="285"
            y="90"
            width="8"
            height="150"
            fill={getFill("prop")}
            stroke="#120B08"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("prop")}
          />
          <circle cx="193" cy="93" r="2.5" fill="#120B08" pointerEvents="none" />
          <circle cx="207" cy="93" r="2.5" fill="#120B08" pointerEvents="none" />
        </svg>
      </div>

      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0
          ? `选色后点击皮影各区域上色(还剩 ${remaining} 处)`
          : "✓ 上色完成!"}
      </p>

      <div className="flex flex-wrap gap-2">
        {COLOR_REGION_IDS.map((id) => (
          <span
            key={id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              colored.has(id)
                ? "border-[#D99A2B]/50 bg-[#D99A2B]/15 text-[#D99A2B]"
                : "border-[#F4E5C0]/15 text-[#F4E5C0]/40",
            )}
          >
            {colored.has(id) ? "✓ " : ""}
            {REGION_LABEL[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
```

> **关于 ColoringGame 完成判定**:`useWorkshopProgress` 里 coloring 用"任意非空"判定,但 ColoringGame 的 `onDone` 在五个 region 都被点过后调用——所以**进度推进**靠 onDone 触发的下一步,而不是 selector。这是可接受的不一致,**Task 15 的 self-review 会决定是否加严**。

- [ ] **Step 3: 在 WorkshopPage 接入两个游戏**

把"M1 占位 - leather"和"M1 占位 - coloring"两段替换:

```tsx
{step.id === "leather" && (
  <LeatherGame onDone={() => void 0} />
)}
{/* ... */}
{step.id === "coloring" && (
  <ColoringGame onDone={() => void 0} />
)}
```

并 import:
```tsx
import { LeatherGame } from "./workshop/games/LeatherGame";
import { ColoringGame } from "./workshop/games/ColoringGame";
```

**完整删掉** WorkshopPage 中的所有 `leatherClicked / handleLeatherTick / handleColorPreset` 局部状态(M1 占位的最后残留)。

- [ ] **Step 4: 类型检查**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 5: Commit**

```bash
git add src/pages/workshop/games/LeatherGame.tsx src/pages/workshop/games/ColoringGame.tsx src/pages/WorkshopPage.tsx
git commit -m "feat(workshop): replace stubs with real LeatherGame (rhythm) + ColoringGame (region painting)"
```

---

### Task 15: 神品彩蛋 + ReplayPage 评级显示 + ColoringGame 完成判定加严

**Files:**
- Modify: `src/store/gameStore.ts`(加严 coloring 完成判定)
- Modify: `src/pages/StagePage.tsx`(神品彩蛋:1 秒定格 + 金色光晕)
- Modify: `src/pages/ReplayPage.tsx`(显示资产评级)

- [ ] **Step 1: 加严 coloring 完成判定**

打开 `src/store/gameStore.ts`,把 `useWorkshopProgress` 里这一行:
```typescript
const coloring = Object.values(p.coloring).some((c) => c !== "" && c != null);
```

改为(改成 store 里增加一个 `coloringDone` flag,因为 ColoringGame 是按"5 个 region 都被主动点过"判定的):

> **更稳妥的做法**:不在 store 加 flag,而是在 selector 里用"颜色 != 默认空 asset 颜色"。但默认 asset 给的是 `#C0442D` 等具体值,无法区分"没改过"和"改成了一样的色"。
>
> **最直接的修法**:把 `createEmptyPuppet` 的 `coloring` 默认值改成空串 `""`,然后保持 `Object.values(p.coloring).every((c) => c !== "")`(注意是 every 不是 some)。

修 `src/types/puppet.ts` 中 `createEmptyPuppet`:
```typescript
coloring: {
  head: "",
  face: "",
  robe: "",
  sash: "",
  prop: "",
},
```

改 `useWorkshopProgress` 中的 coloring 判定:
```typescript
const coloring = Object.values(p.coloring).every((c) => c !== "");
```

确保 `ShadowPuppet` 在颜色为空串时有兜底(否则空串会导致 SVG fill 报错):

打开 `src/components/ShadowPuppet.tsx`,在使用 coloring 的两处加兜底:
```tsx
fill={asset.coloring.robe || "#C0442D"}
// ...
fill={asset.coloring.face || "#F4E5C0"}
// ...
stroke={asset.coloring.robe || "#C0442D"}
// ...
stroke={asset.coloring.prop || "#7A2E18"}
// ...
stroke={asset.coloring.prop || "#7A2E18"}
```

(共 5 处使用 `asset.coloring.*` 的地方,逐一加 `|| "..."` 兜底)

- [ ] **Step 2: StagePage 神品彩蛋**

在 `src/pages/StagePage.tsx` 顶部加 import:
```tsx
import { useEffect as _useEffect } from "react"; // 已有,跳过
```

在 `StagePage` 函数内,`isRunning` 之后加:

```tsx
const carvingGrade = puppet?.carving.grade ?? "下乘";
const jointsGrade = puppet?.joints.grade ?? "下乘";
const isShenpin = carvingGrade === "神品" && jointsGrade === "神品";

// 神品彩蛋:开演前 1 秒定格 + 金色光晕
const [shenpinStarting, setShenpinStarting] = useState(false);
const handleStart = () => {
  if (!isRunning && isShenpin) {
    setShenpinStarting(true);
    setTimeout(() => {
      setShenpinStarting(false);
      setIsRunning(true);
    }, 1000);
  } else {
    setIsRunning((v) => !v);
  }
};
```

把开演按钮的 `onClick={() => setIsRunning((v) => !v)}` 改成 `onClick={handleStart}`。

在影偶容器外层加金色光晕(舞台 ShadowPuppet 包裹 div 后):
```tsx
{shenpinStarting && (
  <div
    className="pointer-events-none absolute inset-0 rounded-[2rem] animate-pulse"
    style={{
      boxShadow: "inset 0 0 80px 20px rgba(217,154,43,0.45), 0 0 60px 10px rgba(217,154,43,0.35)",
      transition: "opacity 1s ease",
    }}
  />
)}
```

- [ ] **Step 3: ReplayPage 显示评级**

打开 `src/pages/ReplayPage.tsx`,在 `<aside>` 第一个 div(本场得分)之后插入:

```tsx
<div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
  <p className="text-sm text-[#F4E5C0]/58">你这具影人</p>
  <div className="mt-3 grid gap-2">
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#F4E5C0]/70">雕刻</span>
      <span
        className="font-serif text-lg"
        style={{ color: GRADE_META[asset.carving.grade].color }}
      >
        {asset.carving.grade}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#F4E5C0]/70">关节</span>
      <span
        className="font-serif text-lg"
        style={{ color: GRADE_META[asset.joints.grade].color }}
      >
        {asset.joints.grade}
      </span>
    </div>
  </div>
</div>
```

并在文件顶部 import:
```tsx
import { GRADE_META } from "@/data/grading";
```

- [ ] **Step 4: 类型检查**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 5: 端到端手动验证**

Run: `npm run dev`

**A 路径(神品)**:
- 选悟空 → 制皮节奏稳定 → 雕刻每条都缓慢稳描 → 上色全涂 → 关节都装在 1 px 内
- 工坊右侧 ShadowPuppet 应该显示清晰镂空 + 金边
- 进入演出,点开演前应该看到 1 秒金色光晕 + 影偶高亮 → 才正式开始
- 演出影偶手臂幅度大(110%)且无抖动
- 演完到回放,看到"雕刻 神品 · 关节 神品"

**B 路径(下乘)**:
- 选白骨精 → 雕刻只随便画 2 条就跳过 → 关节都装在 4+ px
- 工坊右侧 ShadowPuppet 应该有黑块(未雕)+ 模糊纹样
- 演出影偶动作幅度小(60%)且关节抖
- 演完到回放,看到"雕刻 下乘 · 关节 下乘"

**对比**:神品版和下乘版的演出影偶**肉眼可见地不同**。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(m5): shenpin opening shimmer + replay grade card + strict coloring check

M5 milestone:
- Coloring requires all 5 regions explicitly painted (empty default + every() check)
- Stage: 1s golden halo before opening if both carving+joints are 神品
- Replay: shows '雕刻 X · 关节 Y' grade card alongside performance score
- ShadowPuppet color fields fall back to defaults when empty"
```

---

### Task 16: Self-Review 修复 + README 注

**Files:**
- 全局检查
- Modify: `README.md`(添加 migration 注释)

- [ ] **Step 1: 全局搜残留**

Run: `grep -rn "PuppetFigure\|completedSteps\|jointQuality\|selectedRoleId" src/`
Expected: 0 个匹配(所有旧 API 已清空)。如果有,逐个改掉。

- [ ] **Step 2: 全量类型检查 + lint**

Run: `npm run check`
Expected: 全绿。

Run: `npm run lint`
Expected: 全绿(若有 warnings 是项目原有风格,不修)。

- [ ] **Step 3: README 加 migration 说明**

在 `README.md` 末尾追加:

```markdown

## 数据迁移

项目目前处于 demo 阶段。重大架构升级(如 v0 → v2:从 `colors/jointQuality` 迁移到 `PuppetAsset`)采用**清空 localStorage** 的方式不向下兼容。如果之前玩过旧版本,首次打开新版会自动从空状态开始。
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: note demo-stage localStorage migration policy"
```

- [ ] **Step 5: 推送分支**

Run: `git push -u origin feat/puppet-redesign-spec`

---

# 完成验收

✅ **Spec §6 端到端验收清单**(对照 spec):

1. ✅ **一致性证据**:选悟空 → 工坊只做半截(雕刻只描 2 条)→ 直接跳演出 → 演出影偶就是工坊那半截(没雕的 region 是黑块)。**Task 5 实现**。
2. ✅ **角色差异证据**:从首页到演出页,悟空 vs 白骨精轮廓完全不同。**Task 11 实现**。
3. ✅ **玩法兑现**:同一关卡两次,神品版 vs 下乘版的演出影偶清晰度、动作幅度、平滑度肉眼可辨。**Task 5/12/13 实现**。
4. ✅ **难度可控**:小白可"完成走人"按钮直接跳过雕刻余下 region,关节装得差不强制重做。**Task 12/13 实现**。
5. ✅ **彩蛋**:雕刻 + 关节都神品 → 开演 1 秒金色光晕 + 定格。**Task 15 实现**。

---

## Self-Review

完整读完 plan,对照 spec 检查覆盖与一致性:

**1. Spec 覆盖**
- spec §1 资产模型 → Task 1 ✅
- spec §2 共享渲染器 → Task 5 ✅
- spec §3 双核玩法 → Task 12(雕刻)+ Task 13(关节)✅
- spec §3.2 评级映射 → Task 5 内的 `armScale` + `jitterFor` + Task 15 神品彩蛋 ✅
- spec §3.4 氛围工序 → Task 14 ✅
- spec §4 文件清单 → Tasks 1~14 全覆盖 ✅
- spec §5.1 风险 → 雕刻容忍度内置 6px / migration 用 version 升级 / 神品彩蛋有标记 / 完成走人按钮 ✅
- spec §6 验收 → 全部对应任务 ✅

**2. 占位扫描**:全 plan 无 "TBD / TODO / fill in",每个步骤都有具体代码 ✅

**3. 类型一致性**:
- `setCarveRegion(id, data)` 在 Task 3 定义,在 Task 12 使用 ✅
- `recomputeCarvingGrade()` 在 Task 3 定义,在 Task 8 + Task 12 使用 ✅
- `setJointPiece(id, offsetPx)` Task 3 定义,Task 8 + Task 13 使用 ✅
- `useWorkshopProgress` 返回 `WorkshopProgress`,Task 3 定义,Task 7 + Task 8 使用 ✅
- `SilhouetteGeometry`(由 CommonSilhouette export type)Task 4 定义,Task 5 + Task 11 使用 ✅
- `Grade` Task 1 定义,Task 2/12/13/15 使用 ✅

**4. 已修复的不一致**(self-review 时发现并直接 fix):
- Task 14 ColoringGame 完成判定(原文用 "some non-empty",但默认 asset 已有具体值)→ Task 15 改为"createEmptyPuppet 给空串 + every 非空 + ShadowPuppet 兜底"。

无需返工,plan 可执行。

---

## 执行交接

**Plan complete and saved to** `docs/superpowers/plans/2026-06-19-puppet-redesign.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — 我每个 task 派一个 fresh subagent,task 间复审,迭代快、上下文不污染
2. **Inline Execution** — 在当前会话顺序执行 task,带断点供你检阅

**Which approach?**
