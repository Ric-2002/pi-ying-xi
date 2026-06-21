// src/components/puppet/silhouettes/TangsengSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const TANGSENG_GEOMETRY = COMMON_GEOMETRY;

export function TangsengSilhouette() {
  return (
    <g>
      <ellipse
        cx={TANGSENG_GEOMETRY.head.cx}
        cy={TANGSENG_GEOMETRY.head.cy}
        rx={TANGSENG_GEOMETRY.head.rx}
        ry={TANGSENG_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      <path
        d={`M${TANGSENG_GEOMETRY.head.cx - 6} ${TANGSENG_GEOMETRY.head.cy - 9}
            L${TANGSENG_GEOMETRY.head.cx} ${TANGSENG_GEOMETRY.head.cy - 16}
            L${TANGSENG_GEOMETRY.head.cx + 6} ${TANGSENG_GEOMETRY.head.cy - 9} Z`}
        fill="#D99A2B"
      />
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
