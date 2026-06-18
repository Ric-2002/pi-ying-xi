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
