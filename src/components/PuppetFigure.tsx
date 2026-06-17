import type { PuppetPoseData, RoleData } from "@/types/game";

interface PuppetFigureProps {
  role: RoleData;
  pose: PuppetPoseData;
  colors: Record<string, string>;
  isFrontView?: boolean;
  /** 皮影本体透明度（0~1），不影响容器背景和边框。用于工坊制作过程的渐现效果。*/
  puppetOpacity?: number;
}

/**
 * 用 SVG 分层模拟皮影影偶，便于将手势姿态映射到身体、头部、手臂与道具。
 */
export function PuppetFigure({ role, pose, colors, isFrontView = false, puppetOpacity }: PuppetFigureProps) {
  const opacity = puppetOpacity ?? (isFrontView ? 0.78 : 0.92);

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-[2rem] border border-[#D99A2B]/20 bg-[#F4E5C0]/90 shadow-[inset_0_0_80px_rgba(122,46,24,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,246,210,0.9),rgba(244,229,192,0.62)_42%,rgba(93,39,24,0.28))]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id="puppet-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#120B08" floodOpacity="0.45" />
          </filter>
          <pattern id="cutouts" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#120B08" opacity="0.45" />
            <circle cx="6" cy="5" r="0.7" fill="#120B08" opacity="0.32" />
          </pattern>
        </defs>
        <g
          style={{
            transform: `translate(${pose.body.x - 50}px, ${pose.body.y - 58}px) rotate(${pose.body.rotation}deg)`,
            transformOrigin: "50px 58px",
            opacity,
            transition: "opacity 0.4s ease",
          }}
          filter="url(#puppet-shadow)"
        >
          <line x1="50" y1="18" x2="50" y2="95" stroke="#3A302A" strokeWidth="0.7" opacity="0.58" />
          <g style={{ transform: `rotate(${pose.head.rotation}deg)`, transformOrigin: "50px 24px" }}>
            <path d="M42 23 C42 15 47 10 53 12 C59 14 61 21 57 28 C53 35 43 32 42 23Z" fill={colors.face} stroke="#3A302A" strokeWidth="1.5" />
            <path d="M45 18 C49 15 53 15 57 18" stroke="#7A2E18" strokeWidth="1.2" fill="none" />
            <circle cx="53" cy="23" r="1.2" fill="#120B08" />
            <path d="M42 16 L35 12 L41 24" fill={role.accent} opacity="0.88" />
          </g>
          <path
            d="M38 35 C45 31 56 31 63 36 L68 62 C62 73 44 73 34 62 Z"
            fill={colors.robe}
            stroke="#3A302A"
            strokeWidth="1.5"
          />
          <path d="M39 38 C46 45 57 45 64 38 L61 61 C54 65 46 65 39 61Z" fill="url(#cutouts)" opacity="0.38" />
          <g style={{ transform: `rotate(${pose.leftArm.rotation}deg)`, transformOrigin: "40px 40px" }}>
            <path d="M40 40 C31 44 25 51 23 61" stroke={role.color} strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="40" cy="40" r="2.1" fill="#D99A2B" stroke="#3A302A" strokeWidth="0.7" />
            <circle cx="24" cy="61" r="2.2" fill={colors.face} />
          </g>
          <g style={{ transform: `rotate(${pose.rightArm.rotation}deg)`, transformOrigin: "61px 40px" }}>
            <path d="M61 40 C70 44 76 51 78 61" stroke={role.accent} strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="61" cy="40" r="2.1" fill="#D99A2B" stroke="#3A302A" strokeWidth="0.7" />
            <circle cx="78" cy="61" r="2.2" fill={colors.face} />
          </g>
          <g style={{ transform: `rotate(${pose.prop.rotation}deg)`, transformOrigin: "76px 58px" }}>
            <line x1="76" y1="28" x2="76" y2="80" stroke={colors.prop} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M72 28 L80 28 L78 22 L74 22Z" fill={colors.prop} />
          </g>
          <path d="M42 66 L36 87 M58 66 L64 87" stroke="#3A302A" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="42" cy="66" r="1.8" fill="#D99A2B" />
          <circle cx="58" cy="66" r="1.8" fill="#D99A2B" />
        </g>
      </svg>
      <div className="absolute bottom-5 left-5 rounded-full border border-[#7A2E18]/20 bg-[#120B08]/75 px-4 py-2 text-sm text-[#F4E5C0]">
        {role.name} · {isFrontView ? "幕前观看" : "幕后操纵"}
      </div>
    </div>
  );
}
