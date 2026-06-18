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
    /** 0~1,通透度;由制皮小游戏产出(下限 0.7)。空 asset 初始为 0。 */
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

export const CARVE_REGION_IDS = [
  "face",
  "collar",
  "sash",
  "skirtL",
  "skirtR",
  "ornament",
] as const satisfies readonly CarveRegionId[];

export const COLOR_REGION_IDS = [
  "head",
  "face",
  "robe",
  "sash",
  "prop",
] as const satisfies readonly ColorRegionId[];

export const JOINT_IDS = [
  "head",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
] as const satisfies readonly JointId[];

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
  // Object.fromEntries widens to Record<string, …>; keys are typed CarveRegionId so the narrowing is sound.
  const carveRegions = Object.fromEntries(
    CARVE_REGION_IDS.map((id) => [id, { carved: false, quality: 0 }]),
  ) as Record<CarveRegionId, CarveRegionState>;

  // Object.fromEntries widens to Record<string, …>; keys are typed JointId so the narrowing is sound.
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
