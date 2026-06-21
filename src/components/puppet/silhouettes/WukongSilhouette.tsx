// src/components/puppet/silhouettes/WukongSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const WUKONG_GEOMETRY = COMMON_GEOMETRY;

export function WukongSilhouette() {
  return (
    <g>
      <ellipse
        cx={WUKONG_GEOMETRY.head.cx}
        cy={WUKONG_GEOMETRY.head.cy}
        rx={WUKONG_GEOMETRY.head.rx}
        ry={WUKONG_GEOMETRY.head.ry}
        fill="#3A302A"
      />
      <path
        d={`M${WUKONG_GEOMETRY.head.cx - 7} ${WUKONG_GEOMETRY.head.cy - 7}
            Q${WUKONG_GEOMETRY.head.cx} ${WUKONG_GEOMETRY.head.cy - 11}
            ${WUKONG_GEOMETRY.head.cx + 7} ${WUKONG_GEOMETRY.head.cy - 7}`}
        stroke="#D99A2B"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d={`M${WUKONG_GEOMETRY.head.cx - 8} ${WUKONG_GEOMETRY.head.cy - 4}
            L${WUKONG_GEOMETRY.head.cx - 11} ${WUKONG_GEOMETRY.head.cy - 8}`}
        stroke="#3A302A"
        strokeWidth="1.5"
        fill="none"
      />
      <path d={WUKONG_GEOMETRY.torso.d} fill="#3A302A" />
      <path
        d="M38 47 Q50 45 62 47 L62 50 Q50 53 38 50 Z"
        fill="#7A2E18"
        opacity="0.7"
      />
    </g>
  );
}
