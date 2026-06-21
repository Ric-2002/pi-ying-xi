// src/components/puppet/silhouettes/ShasengSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const SHASENG_GEOMETRY = COMMON_GEOMETRY;

export function ShasengSilhouette() {
  return (
    <g>
      <ellipse
        cx={SHASENG_GEOMETRY.head.cx}
        cy={SHASENG_GEOMETRY.head.cy}
        rx={SHASENG_GEOMETRY.head.rx}
        ry={SHASENG_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      <path
        d={`M${SHASENG_GEOMETRY.head.cx - 7} ${SHASENG_GEOMETRY.head.cy + 6}
            Q${SHASENG_GEOMETRY.head.cx} ${SHASENG_GEOMETRY.head.cy + 12}
            ${SHASENG_GEOMETRY.head.cx + 7} ${SHASENG_GEOMETRY.head.cy + 6}`}
        stroke="#3A302A"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d={`M40 35 Q50 38 60 35`}
        stroke="#D99A2B"
        strokeWidth="0.8"
        fill="none"
      />
      <circle cx="42" cy="35.5" r="0.8" fill="#D99A2B" />
      <circle cx="50" cy="36.8" r="0.8" fill="#D99A2B" />
      <circle cx="58" cy="35.5" r="0.8" fill="#D99A2B" />
      <path d={SHASENG_GEOMETRY.torso.d} fill="#3A302A" />
    </g>
  );
}
