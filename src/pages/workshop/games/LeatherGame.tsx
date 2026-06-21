// src/pages/workshop/games/LeatherGame.tsx
import { useCallback, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";

const TACK_COUNT = 12;

function generateTackPoints(): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < TACK_COUNT; i++) {
    const a = (i / TACK_COUNT) * Math.PI * 2 + 0.3;
    pts.push({
      x: 200 + Math.cos(a) * 110,
      y: 150 + Math.sin(a) * 80,
    });
  }
  return pts;
}

interface LeatherGameProps {
  onDone: () => void;
}

export function LeatherGame({ onDone }: LeatherGameProps) {
  const setLeather = useGameStore((s) => s.setLeatherTranslucency);
  const tackPoints = useRef(generateTackPoints());
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const lastClickTimeRef = useRef<number>(0);
  const intervalsRef = useRef<number[]>([]);

  const handleClick = useCallback(
    (i: number) => {
      if (clicked.has(i)) return;
      const now = performance.now();
      if (lastClickTimeRef.current > 0) {
        intervalsRef.current.push(now - lastClickTimeRef.current);
      }
      lastClickTimeRef.current = now;

      const next = new Set(clicked);
      next.add(i);
      setClicked(next);

      if (next.size === TACK_COUNT) {
        const intervals = intervalsRef.current;
        const allTimely = intervals.every((iv) => iv < 1500);
        if (allTimely && intervals.length > 0) {
          const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
          const variance =
            intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
          const stdev = Math.sqrt(variance);
          const t = Math.max(0.7, 1 - (stdev - 200) / 1500);
          setLeather(Math.min(1, t));
        } else {
          setLeather(0.7);
        }
        setTimeout(onDone, 400);
      }
    },
    [clicked, setLeather, onDone],
  );

  const remaining = TACK_COUNT - clicked.size;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #F4E5C0, #C9B68C 55%, #7A2E18 100%)",
          aspectRatio: "4/3",
        }}
      >
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <rect x="20" y="20" width="360" height="260" fill="none" stroke="#3a2412" strokeWidth="3" />
          <text x="200" y="160" textAnchor="middle" fontFamily="serif" fontSize="22" fill="#7A2E18" opacity="0.3">
            牛 皮 · 待 绷
          </text>
          {tackPoints.current.map((pt, i) => (
            <g
              key={i}
              onClick={() => handleClick(i)}
              style={{ cursor: clicked.has(i) ? "default" : "pointer" }}
            >
              {clicked.has(i) ? (
                <>
                  <circle cx={pt.x} cy={pt.y} r={5} fill="#3a2412" />
                  <circle cx={pt.x} cy={pt.y} r={2} fill="#D99A2B" />
                </>
              ) : (
                <circle
                  cx={pt.x} cy={pt.y} r={8}
                  fill="#B3261E" opacity={0.85}
                  stroke="#7A2E18" strokeWidth={1.5}
                />
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0 ? `请按节奏依次点击红点,模拟绷钉 — 还剩 ${remaining} 处` : "✓ 牛皮绷展完成!"}
      </p>
      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>:选皮多用黄牛皮(约3~5岁),浸泡3~4日去毛,往返刮皮3次后绷于木框上阴干。
      </div>
    </div>
  );
}
