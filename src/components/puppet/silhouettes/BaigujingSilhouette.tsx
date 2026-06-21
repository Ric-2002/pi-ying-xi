// src/components/puppet/silhouettes/BaigujingSilhouette.tsx
import { COMMON_GEOMETRY } from "./CommonSilhouette";

export const BAIGUJING_GEOMETRY = COMMON_GEOMETRY;

export function BaigujingSilhouette() {
  return (
    <g>
      <ellipse
        cx={BAIGUJING_GEOMETRY.head.cx}
        cy={BAIGUJING_GEOMETRY.head.cy}
        rx={BAIGUJING_GEOMETRY.head.rx - 0.5}
        ry={BAIGUJING_GEOMETRY.head.ry + 1}
        fill="#3A302A"
      />
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
      <path
        d="M36 35 C40 33 60 33 64 35 L70 64 C66 76 34 76 30 64 Z"
        fill="#3A302A"
      />
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
