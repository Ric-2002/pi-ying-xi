// src/pages/workshop/games/CarvingGame.tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { qualityToGrade, GRADE_META, shouldOfferRetry } from "@/data/grading";
import { CARVE_REGION_IDS } from "@/types/puppet";
import type { CarveRegionId, Grade } from "@/types/puppet";
import { cn } from "@/lib/utils";

// ===== 6 条 region 的虚线起点和路径(在 viewBox 0 0 400 300 内) =====
interface CarvePath {
  id: CarveRegionId;
  label: string;
  /** 一系列折线点,玩家要按顺序经过 */
  points: { x: number; y: number }[];
}

const CARVE_PATHS: CarvePath[] = [
  {
    id: "face",
    label: "脸谱",
    points: [
      { x: 170, y: 85 }, { x: 200, y: 70 }, { x: 230, y: 85 },
      { x: 235, y: 120 }, { x: 200, y: 135 }, { x: 165, y: 120 },
    ],
  },
  {
    id: "collar",
    label: "衣领",
    points: [
      { x: 155, y: 130 }, { x: 200, y: 120 }, { x: 245, y: 130 },
      { x: 248, y: 145 }, { x: 200, y: 155 }, { x: 152, y: 145 },
    ],
  },
  {
    id: "sash",
    label: "腰带",
    points: [
      { x: 145, y: 180 }, { x: 200, y: 172 }, { x: 255, y: 180 },
      { x: 255, y: 195 }, { x: 200, y: 205 }, { x: 145, y: 195 },
    ],
  },
  {
    id: "skirtL",
    label: "左裙",
    points: [
      { x: 150, y: 210 }, { x: 180, y: 210 },
      { x: 175, y: 260 }, { x: 155, y: 258 },
    ],
  },
  {
    id: "skirtR",
    label: "右裙",
    points: [
      { x: 220, y: 210 }, { x: 250, y: 210 },
      { x: 245, y: 260 }, { x: 225, y: 260 },
    ],
  },
  {
    id: "ornament",
    label: "纹饰",
    points: [
      { x: 190, y: 95 }, { x: 210, y: 95 },
      { x: 208, y: 105 }, { x: 192, y: 105 },
    ],
  },
];

/** 折线 → SVG path d 字符串 */
function pointsToPath(pts: { x: number; y: number }[]): string {
  return pts
    .map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`))
    .concat(`L${pts[0].x} ${pts[0].y}`)
    .join(" ");
}

/** 点 P 到线段 AB 的最近距离 */
function pointSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** 点 P 到整条折线(闭合)的最小距离 */
function distanceToPath(
  px: number, py: number,
  pts: { x: number; y: number }[],
): number {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const d = pointSegmentDistance(px, py, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

interface CarvingGameProps {
  onAllDone: (grade: Grade) => void;
}

export function CarvingGame({ onAllDone }: CarvingGameProps) {
  const setCarveRegion = useGameStore((s) => s.setCarveRegion);
  const recomputeCarving = useGameStore((s) => s.recomputeCarvingGrade);
  const puppet = useGameStore((s) => s.puppet);

  // 当前激活的 region(已雕的跳过)
  const activePath = useMemo(() => {
    if (!puppet) return CARVE_PATHS[0];
    return (
      CARVE_PATHS.find((p) => !puppet.carving.regions[p.id]?.carved) ??
      CARVE_PATHS[CARVE_PATHS.length - 1]
    );
  }, [puppet]);

  const [isDragging, setIsDragging] = useState(false);
  const samplesRef = useRef<{ x: number; y: number; t: number; dist: number }[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);
  // Force-rerender after each move so samples render as the player traces.
  // The sample buffer lives in a ref to avoid stale-closure issues during fast drags.
  const [strokeTick, setStrokeTick] = useState(0);

  const [pendingRetry, setPendingRetry] = useState<{
    id: CarveRegionId;
    grade: Grade;
    quality: number;
  } | null>(null);

  const toSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const handleDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (pendingRetry) return;
      const p = toSvg(e);
      if (!p) return;
      samplesRef.current = [];
      setIsDragging(true);
      const dist = distanceToPath(p.x, p.y, activePath.points);
      samplesRef.current.push({ x: p.x, y: p.y, t: performance.now(), dist });
      setLivePos(p);
      setStrokeTick((t) => t + 1);
    },
    [activePath, pendingRetry],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging) return;
      const p = toSvg(e);
      if (!p) return;
      const dist = distanceToPath(p.x, p.y, activePath.points);
      samplesRef.current.push({ x: p.x, y: p.y, t: performance.now(), dist });
      setLivePos(p);
      setStrokeTick((t) => t + 1);
    },
    [activePath, isDragging],
  );

  const acceptStroke = useCallback(
    (id: CarveRegionId, quality: number) => {
      setCarveRegion(id, { carved: true, quality });
      recomputeCarving();

      // 检查是否还有未雕的;读最新 store 状态
      const latest = useGameStore.getState().puppet;
      const remaining = CARVE_PATHS.filter(
        (p) => p.id !== id && !latest?.carving.regions[p.id]?.carved,
      );
      if (remaining.length === 0) {
        const finalQuality = latest?.carving.overallQuality ?? quality;
        onAllDone(qualityToGrade(finalQuality));
      }
      // 清空采样以备下一笔
      samplesRef.current = [];
    },
    [setCarveRegion, recomputeCarving, onAllDone],
  );

  const finishStroke = useCallback(() => {
    setIsDragging(false);
    setLivePos(null);
    const samples = samplesRef.current;
    if (samples.length < 8) return; // 太短,丢弃

    // 偏差均值 → 越小越好,容忍带宽 6px
    const avgDist = samples.reduce((s, v) => s + v.dist, 0) / samples.length;
    const distScore = Math.max(0, 1 - avgDist / 6);

    // 速度方差 → 越小越好
    const speeds: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      const dt = Math.max(1, b.t - a.t);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      speeds.push((Math.hypot(dx, dy) / dt) * 1000);
    }
    const meanSpeed = speeds.reduce((s, v) => s + v, 0) / Math.max(1, speeds.length);
    const variance =
      speeds.reduce((s, v) => s + (v - meanSpeed) ** 2, 0) /
      Math.max(1, speeds.length);
    const stdev = Math.sqrt(variance);
    const speedScore = Math.max(0, 1 - stdev / 500);

    const quality = distScore * 0.7 + speedScore * 0.3;
    const grade = qualityToGrade(quality);

    if (shouldOfferRetry(grade)) {
      setPendingRetry({ id: activePath.id, grade, quality });
    } else {
      acceptStroke(activePath.id, quality);
    }
  }, [activePath, acceptStroke]);

  const handleRetryAccept = () => {
    setPendingRetry(null);
    samplesRef.current = [];
  };

  const handleRetryDecline = () => {
    if (pendingRetry) {
      acceptStroke(pendingRetry.id, pendingRetry.quality);
      setPendingRetry(null);
    }
  };

  const handleSkip = useCallback(() => {
    recomputeCarving();
    const finalQuality = useGameStore.getState().puppet?.carving.overallQuality ?? 0;
    onAllDone(qualityToGrade(finalQuality));
  }, [recomputeCarving, onAllDone]);

  // strokeTick is read here to force-rerender the samples polylines as the stroke progresses
  void strokeTick;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{ background: "#F4E5C0", aspectRatio: "4/3" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 400 300"
          className="absolute inset-0 h-full w-full select-none"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={finishStroke}
          onMouseLeave={() => isDragging && finishStroke()}
          style={{ cursor: pendingRetry ? "default" : "crosshair" }}
        >
          <rect x="30" y="20" width="340" height="260" fill="#F4E5C0" stroke="#7A2E18" strokeWidth="2" />

          {/* 已完成的 region */}
          {CARVE_PATHS.filter((p) => puppet?.carving.regions[p.id]?.carved).map((p) => (
            <path
              key={p.id}
              d={pointsToPath(p.points)}
              fill="rgba(18,11,8,0.35)"
              stroke="#120B08"
              strokeWidth="1.5"
            />
          ))}

          {/* 当前激活 region — 红色虚线 */}
          {!pendingRetry && (
            <path
              d={pointsToPath(activePath.points)}
              fill="none"
              stroke="rgba(179,38,30,0.6)"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
          )}

          {/* 未激活 region — 暗淡 */}
          {CARVE_PATHS.filter(
            (p) => !puppet?.carving.regions[p.id]?.carved && p.id !== activePath.id,
          ).map((p) => (
            <path
              key={p.id}
              d={pointsToPath(p.points)}
              fill="none"
              stroke="rgba(122,46,24,0.2)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ))}

          {/* 实时刀痕(直接 read samplesRef.current; strokeTick 触发 rerender) */}
          {samplesRef.current.length > 1 &&
            samplesRef.current.map((s, i) => {
              if (i === 0) return null;
              const prev = samplesRef.current[i - 1];
              const w = Math.max(0.4, 2.5 - s.dist * 0.4);
              const op = Math.max(0.25, 1 - s.dist / 8);
              return (
                <line
                  key={i}
                  x1={prev.x} y1={prev.y} x2={s.x} y2={s.y}
                  stroke="#3a2412"
                  strokeWidth={w}
                  opacity={op}
                />
              );
            })}

          {/* 实时刻刀光标 */}
          {livePos && (
            <circle cx={livePos.x} cy={livePos.y} r="3" fill="none" stroke="#D99A2B" strokeWidth="1.5" />
          )}
        </svg>

        {pendingRetry && (
          <div className="absolute inset-0 grid place-items-center bg-[#120B08]/80 backdrop-blur-sm">
            <div className="rounded-2xl border border-[#D99A2B]/40 bg-[#1C100B] p-6 text-center max-w-[300px]">
              <p
                className="font-serif text-2xl"
                style={{ color: GRADE_META[pendingRetry.grade].color }}
              >
                {GRADE_META[pendingRetry.grade].label}
              </p>
              <p className="mt-2 text-sm text-[#F4E5C0]/70">
                {GRADE_META[pendingRetry.grade].flavor}
              </p>
              <p className="mt-3 text-xs text-[#F4E5C0]/50">可以挽救你的影人吗?</p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetryAccept}
                  className="flex-1 rounded-full bg-[#D99A2B] py-2 text-sm font-semibold text-[#120B08]"
                >
                  再来一次
                </button>
                <button
                  type="button"
                  onClick={handleRetryDecline}
                  className="flex-1 rounded-full border border-[#F4E5C0]/30 py-2 text-sm text-[#F4E5C0]"
                >
                  接受 · 继续
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-[#D99A2B]">
          当前:{activePath.label} — 按住鼠标沿虚线一笔到底
        </p>
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-full border border-[#F4E5C0]/16 px-3 py-1 text-xs text-[#F4E5C0]/60 transition hover:bg-[#F4E5C0]/8"
        >
          完成走人(跳过剩余)
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CARVE_PATHS.map((p) => {
          const r = puppet?.carving.regions[p.id];
          const carved = r?.carved ?? false;
          return (
            <span
              key={p.id}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                carved
                  ? "border-[#D99A2B]/50 bg-[#D99A2B]/15 text-[#D99A2B]"
                  : "border-[#F4E5C0]/15 text-[#F4E5C0]/40",
              )}
            >
              {carved ? <Check className="inline h-3 w-3 mr-1" /> : null}
              {p.label}
              {carved && r ? ` · ${qualityToGrade(r.quality)}` : ""}
            </span>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>:皮影雕刻讲究推刀、拉刀、冲孔并用,一件影人常需三千余刀,刀刀不可错。
      </div>
    </div>
  );
}
