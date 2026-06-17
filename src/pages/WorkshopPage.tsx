import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ProgressRail } from "@/components/ProgressRail";
import { PuppetFigure } from "@/components/PuppetFigure";
import { roles, workshopSteps } from "@/data/gameData";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import type { PuppetPoseData, RoleId } from "@/types/game";

// ===== 传统矿物色盘（10色） =====
const PALETTE = [
  { name: "朱砂", color: "#B3261E" },
  { name: "赭石", color: "#7A2E18" },
  { name: "藤黄", color: "#D99A2B" },
  { name: "石青", color: "#1D6F7A" },
  { name: "石绿", color: "#2F6B3E" },
  { name: "象牙白", color: "#F4E5C0" },
  { name: "烟墨", color: "#3A302A" },
  { name: "胭脂", color: "#8A1C33" },
  { name: "泥金", color: "#A8813A" },
  { name: "靛蓝", color: "#2A3E66" },
];

// ===== 雕刻路径区域 =====
const CARVE_REGIONS = [
  { id: "face", label: "脸谱", d: "M170 85 Q200 70 230 85 L235 120 Q200 135 165 120 Z" },
  { id: "collar", label: "衣领", d: "M155 130 Q200 120 245 130 L248 145 Q200 155 152 145 Z" },
  { id: "sash", label: "腰带", d: "M145 180 Q200 172 255 180 L255 195 Q200 205 145 195 Z" },
  { id: "skirtL", label: "左裙", d: "M150 210 L180 210 L175 260 L155 258 Z" },
  { id: "skirtR", label: "右裙", d: "M220 210 L250 210 L245 258 L225 260 Z" },
  { id: "ornament", label: "纹饰", d: "M190 95 L210 95 L208 105 L192 105 Z" },
];

// ===== 上色区域 =====
const COLOR_REGIONS = [
  { id: "head", label: "头", el: "ellipse", attrs: { cx: "200", cy: "95", rx: "32", ry: "38" } },
  { id: "face", label: "脸", el: "path", attrs: { d: "M180 90 Q200 80 220 90 Q218 115 200 120 Q182 115 180 90 Z" } },
  { id: "robe", label: "身体", el: "path", attrs: { d: "M155 135 Q200 125 245 135 L255 245 Q200 265 145 245 Z" } },
  { id: "sash", label: "腰带", el: "path", attrs: { d: "M150 185 Q200 178 250 185 L252 200 Q200 210 148 200 Z" } },
  { id: "prop", label: "道具", el: "rect", attrs: { x: "285", y: "90", width: "8", height: "150" } },
];

// ===== 生成散布的绷钉位置 =====
function generateTackPoints(seed = 42): { x: number; y: number }[] {
  // 使用固定种子确保每次渲染一致
  const pts: { x: number; y: number }[] = [];
  const rng = (n: number) => {
    const x = Math.sin(n + seed) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 12; i++) {
    const a = rng(i * 2) * Math.PI * 2;
    pts.push({
      x: 200 + Math.cos(a) * (80 + rng(i * 2 + 1) * 90),
      y: 150 + Math.sin(a) * (60 + rng(i * 3) * 70),
    });
  }
  return pts;
}

// ===== 制皮迷你游戏 =====
function LeatherGame({ onComplete, onProgress }: { onComplete: () => void; onProgress?: (ratio: number) => void }) {
  const tackPoints = useRef(generateTackPoints());
  const [clicked, setClicked] = useState<Set<number>>(new Set());

  const handleClick = (i: number) => {
    setClicked((prev) => {
      const next = new Set(prev);
      next.add(i);
      const ratio = next.size / tackPoints.current.length;
      onProgress?.(ratio);
      if (next.size === tackPoints.current.length) {
        setTimeout(onComplete, 400);
      }
      return next;
    });
  };

  const remaining = tackPoints.current.length - clicked.size;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{ background: "radial-gradient(ellipse at 50% 40%, #F4E5C0, #C9B68C 55%, #7A2E18 100%)", aspectRatio: "4/3" }}>
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="leatherGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#F4E5C0" />
              <stop offset="70%" stopColor="#C9B68C" />
              <stop offset="100%" stopColor="#7A2E18" />
            </radialGradient>
          </defs>
          <rect x="20" y="20" width="360" height="260" fill="url(#leatherGrad)" stroke="#3a2412" strokeWidth="3" />
          <text x="200" y="160" textAnchor="middle" fontFamily="serif" fontSize="22" fill="#7A2E18" opacity="0.3">
            牛 皮 · 待 绷
          </text>
          {tackPoints.current.map((pt, i) => (
            <g key={i} onClick={() => !clicked.has(i) && handleClick(i)} style={{ cursor: clicked.has(i) ? "default" : "pointer" }}>
              {clicked.has(i) ? (
                <>
                  <circle cx={pt.x} cy={pt.y} r={5} fill="#3a2412" />
                  <circle cx={pt.x} cy={pt.y} r={2} fill="#D99A2B" />
                </>
              ) : (
                <circle cx={pt.x} cy={pt.y} r={8} fill="#B3261E" opacity={0.85}
                  stroke="#7A2E18" strokeWidth={1.5}
                  className="transition-transform hover:scale-110" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0 ? `请依次点击红点，模拟绷钉 — 还剩 ${remaining} 处` : "✓ 牛皮绷展完成！"}
      </p>
      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>：选皮多用黄牛皮（约3~5岁），浸泡3~4日去毛，往返刮皮3次后绷于木框上阴干。
      </div>
    </div>
  );
}

// ===== 雕刻迷你游戏 =====
function CarvingGame({ onComplete, onProgress }: { onComplete: () => void; onProgress?: (ratio: number) => void }) {
  const [carved, setCarved] = useState<Set<string>>(new Set());

  const handleCarve = (id: string) => {
    setCarved((prev) => {
      const next = new Set(prev);
      next.add(id);
      const ratio = next.size / CARVE_REGIONS.length;
      onProgress?.(ratio);
      if (next.size === CARVE_REGIONS.length) {
        setTimeout(onComplete, 400);
      }
      return next;
    });
  };

  const remaining = CARVE_REGIONS.length - carved.size;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40" style={{ background: "#F4E5C0", aspectRatio: "4/3" }}>
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <rect x="30" y="20" width="340" height="260" fill="#F4E5C0" stroke="#7A2E18" strokeWidth="2" />
          {CARVE_REGIONS.map((region) => {
            const done = carved.has(region.id);
            return (
              <path
                key={region.id}
                d={region.d}
                onClick={() => !done && handleCarve(region.id)}
                fill={done ? "rgba(18,11,8,0.35)" : "none"}
                stroke={done ? "#120B08" : "rgba(179,38,30,0.6)"}
                strokeWidth={done ? "1.5" : "3"}
                strokeDasharray={done ? "0" : "6 4"}
                style={{
                  cursor: done ? "default" : "pointer",
                  animation: done ? "none" : "dashAnim 1.5s linear infinite",
                }}
              />
            );
          })}
          {/* 刀痕效果 */}
          {[...carved].map((id) => {
            const r = CARVE_REGIONS.find((x) => x.id === id);
            if (!r) return null;
            return <path key={`cut-${id}`} d={r.d} fill="none" stroke="rgba(18,11,8,0.12)" strokeWidth="0.5" />;
          })}
        </svg>
        <style>{`@keyframes dashAnim { to { stroke-dashoffset: -20; } }`}</style>
      </div>
      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0 ? `点击虚线路径进行雕刻（还剩 ${remaining} 处）` : "✓ 雕刻完成！你的影人拥有了专属纹路。"}
      </p>
      <div className="flex flex-wrap gap-2">
        {CARVE_REGIONS.map((r) => (
          <span key={r.id} className={cn("rounded-full border px-3 py-1 text-xs transition",
            carved.has(r.id)
              ? "border-[#D99A2B]/50 bg-[#D99A2B]/15 text-[#D99A2B]"
              : "border-[#F4E5C0]/15 text-[#F4E5C0]/40")}>
            {carved.has(r.id) ? "✓ " : ""}{r.label}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>：皮影雕刻讲究推刀、拉刀、冲孔并用，一件影人常需三千余刀，刀刀不可错。
      </div>
    </div>
  );
}

// ===== 上色迷你游戏 =====
function ColoringGame({
  colors,
  onColorChange,
  onComplete,
}: {
  colors: Record<string, string>;
  onColorChange: (region: string, color: string) => void;
  onComplete: () => void;
}) {
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color);
  const [coloredRegions, setColoredRegions] = useState<Set<string>>(new Set());

  // 初始化时把 store 里已有颜色的区域纳入
  useEffect(() => {
    const initial = new Set<string>();
    COLOR_REGIONS.forEach((r) => {
      if (colors[r.id]) initial.add(r.id);
    });
    setColoredRegions(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegionClick = (regionId: string) => {
    onColorChange(regionId, selectedColor);
    setColoredRegions((prev) => {
      const next = new Set(prev);
      next.add(regionId);
      if (next.size === COLOR_REGIONS.length) {
        setTimeout(onComplete, 400);
      }
      return next;
    });
  };

  const getRegionFill = (id: string) => colors[id] || (id === "robe" ? "#B3261E" : id === "face" ? "#E5CF95" : id === "sash" ? "#F4E5C0" : id === "prop" ? "#7A2E18" : "#F4E5C0");

  const remaining = COLOR_REGIONS.length - coloredRegions.size;

  return (
    <div className="space-y-3">
      {/* 色盘 */}
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((p) => (
          <button
            key={p.color}
            type="button"
            title={p.name}
            onClick={() => setSelectedColor(p.color)}
            className={cn(
              "h-9 w-9 rounded-full border-2 transition hover:scale-110",
              selectedColor === p.color ? "border-[#F4E5C0] ring-2 ring-[#D99A2B] ring-offset-1 ring-offset-[#1C100B]" : "border-[#5a411d]"
            )}
            style={{ backgroundColor: p.color }}
            aria-label={p.name}
          />
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm text-[#F4E5C0]/60">
          <span className="h-5 w-5 rounded-full border border-[#F4E5C0]/20" style={{ backgroundColor: selectedColor }} />
          当前色：{PALETTE.find((p) => p.color === selectedColor)?.name}
        </div>
      </div>

      {/* 可上色的皮影 */}
      <div className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40" style={{ background: "#F4E5C0", aspectRatio: "4/3" }}>
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <rect x="20" y="20" width="360" height="260" fill="#F4E5C0" stroke="#7A2E18" strokeWidth="2" />
          {/* 头 */}
          <ellipse
            cx="200" cy="95" rx="32" ry="38"
            fill={getRegionFill("head")} stroke="#3a2412" strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onClick={() => handleRegionClick("head")}
            className="transition-all hover:stroke-[#B3261E] hover:stroke-2"
          />
          {/* 脸 */}
          <path
            d="M180 90 Q200 80 220 90 Q218 115 200 120 Q182 115 180 90 Z"
            fill={getRegionFill("face")} stroke="#3a2412" strokeWidth="1"
            style={{ cursor: "pointer" }}
            onClick={() => handleRegionClick("face")}
            className="transition-all hover:stroke-[#B3261E] hover:stroke-2"
          />
          {/* 身体 */}
          <path
            d="M155 135 Q200 125 245 135 L255 245 Q200 265 145 245 Z"
            fill={getRegionFill("robe")} stroke="#3a2412" strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onClick={() => handleRegionClick("robe")}
            className="transition-all hover:stroke-[#B3261E] hover:stroke-2"
          />
          {/* 腰带 */}
          <path
            d="M150 185 Q200 178 250 185 L252 200 Q200 210 148 200 Z"
            fill={getRegionFill("sash")} stroke="#3a2412" strokeWidth="1"
            style={{ cursor: "pointer" }}
            onClick={() => handleRegionClick("sash")}
            className="transition-all hover:stroke-[#B3261E] hover:stroke-2"
          />
          {/* 道具 */}
          <rect
            x="285" y="90" width="8" height="150"
            fill={getRegionFill("prop")} stroke="#120B08"
            style={{ cursor: "pointer" }}
            onClick={() => handleRegionClick("prop")}
            className="transition-all hover:stroke-[#B3261E] hover:stroke-2"
          />
          {/* 眼睛（装饰，不可点击） */}
          <circle cx="193" cy="93" r="2.5" fill="#120B08" pointerEvents="none" />
          <circle cx="207" cy="93" r="2.5" fill="#120B08" pointerEvents="none" />
        </svg>
      </div>

      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0 ? `选色后点击皮影各区域上色（还剩 ${remaining} 处）` : "✓ 上色完成！颜色将在演出中呈现。"}
      </p>
      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>：皮影上色采用矿物颜料，薄涂多层称"晕染"。朱砂辟邪、石青稳心、藤黄显富贵，配色即人物性格。
      </div>
    </div>
  );
}

// ===== 装关节迷你游戏 =====
interface JointState {
  leftArm: number;
  rightArm: number;
  head: number;
}

function JointingGame({
  colors,
  role,
  onComplete,
}: {
  colors: Record<string, string>;
  role: { color: string; accent: string; name: string; id: string };
  onComplete: (joints: JointState) => void;
}) {
  const [joints, setJoints] = useState<JointState>({ leftArm: 0, rightArm: 0, head: 0 });
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onComplete(joints);
  };

  const previewPose: PuppetPoseData = {
    body: { x: 50, y: 58, rotation: joints.head * 0.3 },
    leftArm: { rotation: joints.leftArm },
    rightArm: { rotation: joints.rightArm },
    head: { rotation: joints.head },
    prop: { rotation: joints.rightArm * 0.5 },
  };

  return (
    <div className="space-y-4">
      {/* 皮影预览（用实际 PuppetFigure 组件） */}
      <div className="mx-auto max-w-[320px]">
        <PuppetFigure
          role={role as Parameters<typeof PuppetFigure>[0]["role"]}
          pose={previewPose}
          colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }}
        />
      </div>

      {/* 三个关节滑块 */}
      <div className="rounded-2xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-5 space-y-4">
        {([
          { key: "leftArm", label: "左肩关节", min: -90, max: 60, color: "#1D6F7A" },
          { key: "rightArm", label: "右肩关节", min: -60, max: 90, color: "#B3261E" },
          { key: "head", label: "颈部转轴", min: -25, max: 25, color: "#D99A2B" },
        ] as const).map((item) => (
          <label key={item.key} className="block">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[#F4E5C0]/80">{item.label}</span>
              <span className="font-mono text-xs" style={{ color: item.color }}>{joints[item.key]}°</span>
            </div>
            <input
              type="range"
              min={item.min}
              max={item.max}
              value={joints[item.key]}
              onChange={(e) => setJoints((prev) => ({ ...prev, [item.key]: Number(e.target.value) }))}
              className="w-full accent-[#D99A2B]"
            />
          </label>
        ))}
      </div>

      {!confirmed ? (
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-full bg-[#D99A2B] py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
        >
          确认关节 · 锁定登场姿态
        </button>
      ) : (
        <p className="text-center text-sm text-[#D99A2B]">✓ 关节已装配！影人已就绪。</p>
      )}

      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>：皮影以铜钉或丝线串联关节，典型影人有11~13个关节，由主杆（控身形）和手杆（控手臂）驱动。
      </div>
    </div>
  );
}

// ===== 主工坊页 =====
export function WorkshopPage() {
  const params = useParams();
  const selectedRoleId = useGameStore((state) => state.selectedRoleId);
  const completedSteps = useGameStore((state) => state.completedSteps);
  const colors = useGameStore((state) => state.colors);
  const currentPose = useGameStore((state) => state.currentPose);
  const completeStep = useGameStore((state) => state.completeStep);
  const setColor = useGameStore((state) => state.setColor);
  const setJointQuality = useGameStore((state) => state.setJointQuality);
  const setPose = useGameStore((state) => state.setPose);

  const roleId = (params.roleId as RoleId | undefined) ?? selectedRoleId;
  const role = roles.find((item) => item.id === roleId) ?? roles[0];

  // 当前激活的工序下标
  const activeIdx = completedSteps.length < workshopSteps.length ? completedSteps.length : workshopSteps.length - 1;

  // 制皮 / 雕刻进度（0~1），用于右侧皮影视觉反馈
  const [leatherProgress, setLeatherProgress] = useState(0);
  const [carvingProgress, setCarvingProgress] = useState(0);

  const handleLeatherComplete = useCallback(() => {
    setLeatherProgress(1);
    completeStep("leather");
  }, [completeStep]);

  const handleCarvingComplete = useCallback(() => {
    setCarvingProgress(1);
    completeStep("carving");
  }, [completeStep]);

  const handleColoringComplete = useCallback(() => {
    completeStep("coloring");
  }, [completeStep]);

  const handleJointingComplete = useCallback((joints: JointState) => {
    // 将关节初始角度写入姿态
    setPose({
      ...currentPose,
      leftArm: { rotation: joints.leftArm },
      rightArm: { rotation: joints.rightArm },
      head: { rotation: joints.head },
    });
    setJointQuality(96);
    completeStep("jointing");
  }, [completeStep, currentPose, setPose, setJointQuality]);

  return (
    <GameShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">第二步 · 工坊</p>
          <h1 className="font-serif text-4xl font-black text-[#F4E5C0] sm:text-5xl">
            为 {role.name} 制作可动皮影
          </h1>
        </div>
        <Link
          to={`/rehearsal/${role.id}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
            completedSteps.length >= 4
              ? "bg-[#D99A2B] text-[#120B08] hover:-translate-y-0.5"
              : "border border-[#F4E5C0]/16 text-[#F4E5C0]/40 pointer-events-none",
          )}
        >
          进入排练
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ProgressRail completedSteps={completedSteps} />

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        {/* 左侧：工序步骤列表 + 迷你游戏 */}
        <div className="space-y-4">
          {workshopSteps.map((step, idx) => {
            const done = completedSteps.includes(step.id);
            const isActive = idx === activeIdx;
            const isLocked = idx > activeIdx && !done;

            return (
              <article
                key={step.id}
                className={cn(
                  "rounded-[1.8rem] border p-5 transition",
                  done
                    ? "border-[#D99A2B]/50 bg-[#D99A2B]/12"
                    : isActive
                    ? "border-[#D99A2B]/40 bg-[#1C100B]/90"
                    : "border-[#F4E5C0]/8 bg-[#1C100B]/50 opacity-50",
                )}
              >
                {/* 工序标题 */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {done && <Check className="h-4 w-4 flex-shrink-0 text-[#D99A2B]" />}
                      <h2 className="font-serif text-2xl text-[#F4E5C0]">{step.name}</h2>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-[#F4E5C0]/60">{step.craftNote}</p>
                    <p className="mt-2 text-sm text-[#D99A2B]">{step.gameGoal}</p>
                  </div>
                  {isLocked && (
                    <span className="mt-1 flex-shrink-0 rounded-full border border-[#F4E5C0]/10 px-3 py-1 text-xs text-[#F4E5C0]/30">
                      待解锁
                    </span>
                  )}
                </div>

                {/* 迷你游戏区域（仅展示激活中的工序） */}
                {isActive && !done && (
                  <div className="mt-4 border-t border-[#F4E5C0]/8 pt-4">
                    {step.id === "leather" && (
                      <LeatherGame onComplete={handleLeatherComplete} onProgress={setLeatherProgress} />
                    )}
                    {step.id === "carving" && (
                      <CarvingGame onComplete={handleCarvingComplete} onProgress={setCarvingProgress} />
                    )}
                    {step.id === "coloring" && (
                      <ColoringGame
                        colors={colors}
                        onColorChange={setColor}
                        onComplete={handleColoringComplete}
                      />
                    )}
                    {step.id === "jointing" && (
                      <JointingGame
                        colors={colors}
                        role={role}
                        onComplete={handleJointingComplete}
                      />
                    )}
                  </div>
                )}

                {done && (
                  <p className="mt-1 text-sm text-[#D99A2B]/70">已完成 ✓</p>
                )}
              </article>
            );
          })}
        </div>

        {/* 右侧：皮影预览 */}
        <aside className="sticky top-6 h-fit">
          {/* 计算皮影本体透明度：只影响 SVG 人物，容器背景/边框保持不变
              制皮中：0.2 → 0.92 随绷钉进度线性插值
              制皮完成后雕刻中：0.92 → 0.92（正常，雕刻光效通过 PuppetFigure 内部渐现自然呈现）
              其余阶段：默认 0.92 */}
          {(() => {
            const leatherDone = completedSteps.includes("leather");
            const computedOpacity = leatherDone
              ? 0.92
              : 0.2 + leatherProgress * 0.72; // 0.2 起始，确保影人轮廓可见但暗淡
            return (
              <PuppetFigure
                role={role}
                pose={currentPose}
                colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }}
                puppetOpacity={computedOpacity}
              />
            );
          })()}
          <p className="mt-4 text-sm leading-6 text-[#F4E5C0]/58">
            每完成一步，影偶都会更接近可演状态。装好关节后，你会在幕后学习如何把它「活」起来。
          </p>
          {completedSteps.length >= 4 && (
            <Link
              to={`/rehearsal/${role.id}`}
              className="mt-4 block w-full rounded-full bg-[#D99A2B] py-3 text-center text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
            >
              影人已就绪 · 进入排练 →
            </Link>
          )}
        </aside>
      </section>
    </GameShell>
  );
}
