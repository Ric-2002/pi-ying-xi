// src/components/puppet/silhouettes/BajieSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const BAJIE_GEOMETRY = COMMON_GEOMETRY;

export function BajieSilhouette() {
  return (
    <g>
      <ellipse
        cx={BAJIE_GEOMETRY.head.cx}
        cy={BAJIE_GEOMETRY.head.cy}
        rx={BAJIE_GEOMETRY.head.rx + 1.5}
        ry={BAJIE_GEOMETRY.head.ry - 0.5}
        fill="#3A302A"
      />
      <path
        d={`M${BAJIE_GEOMETRY.head.cx + 9} ${BAJIE_GEOMETRY.head.cy + 1}
            Q${BAJIE_GEOMETRY.head.cx + 14} ${BAJIE_GEOMETRY.head.cy + 3}
            ${BAJIE_GEOMETRY.head.cx + 9} ${BAJIE_GEOMETRY.head.cy + 4} Z`}
        fill="#3A302A"
      />
      <path
        d={`M${BAJIE_GEOMETRY.head.cx - 9} ${BAJIE_GEOMETRY.head.cy - 1}
            Q${BAJIE_GEOMETRY.head.cx - 13} ${BAJIE_GEOMETRY.head.cy + 4}
            ${BAJIE_GEOMETRY.head.cx - 8} ${BAJIE_GEOMETRY.head.cy + 5}`}
        stroke="#3A302A"
        strokeWidth="1.8"
        fill="#3A302A"
      />
      <path
        d="M36 35 C44 30 56 30 64 35 L70 64 C62 75 38 75 30 64 Z"
        fill="#3A302A"
      />
    </g>
  );
}
