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

export { CommonSilhouette, COMMON_GEOMETRY };

export function resolveSilhouette(roleId: RoleId): SilhouetteEntry {
  return REGISTRY[roleId];
}

export type { SilhouetteGeometry } from "./CommonSilhouette";
