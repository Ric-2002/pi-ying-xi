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
