// src/pages/workshop/games/JointingGame.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { qualityToGrade, GRADE_META, shouldOfferRetry } from "@/data/grading";
import { JOINT_IDS } from "@/types/puppet";
import type { Grade, JointId } from "@/types/puppet";
import { cn } from "@/lib/utils";

interface AnchorPos {
  x: number;
  y: number;
}

const ANCHOR_BASE: Record<JointId, AnchorPos> = {
  head: { x: 200, y: 60 },
  leftArm: { x: 160, y: 130 },
  rightArm: { x: 240, y: 130 },
  leftLeg: { x: 180, y: 230 },
  rightLeg: { x: 220, y: 230 },
};

const PIECE_LABEL: Record<JointId, string> = {
  head: "头",
  leftArm: "左臂",
  rightArm: "右臂",
  leftLeg: "左腿",
  rightLeg: "右腿",
};

const PIECE_START: Record<JointId, AnchorPos> = {
  head: { x: 80, y: 50 },
  leftArm: { x: 60, y: 150 },
  rightArm: { x: 320, y: 150 },
  leftLeg: { x: 80, y: 240 },
  rightLeg: { x: 320, y: 240 },
};

interface JointingGameProps {
  onAllDone: (grade: Grade) => void;
}

export function JointingGame({ onAllDone }: JointingGameProps) {
  const setJointPiece = useGameStore((s) => s.setJointPiece);
  const recomputeJoints = useGameStore((s) => s.recomputeJointsGrade);
  const puppet = useGameStore((s) => s.puppet);

  const [piecePos, setPiecePos] = useState<Record<JointId, AnchorPos>>(() => ({
    ...PIECE_START,
  }));
  const [installed, setInstalled] = useState<
    Partial<Record<JointId, { offsetPx: number }>>
  >({});
  const [anchorJitter, setAnchorJitter] = useState<Record<JointId, AnchorPos>>(
    () => ({ ...ANCHOR_BASE }),
  );

  const dragRef = useRef<{ id: JointId; offsetX: number; offsetY: number } | null>(
    null,
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [phase, setPhase] = useState<"assembling" | "trial" | "done">("assembling");
  const [pendingRetry, setPendingRetry] = useState<{ grade: Grade } | null>(null);

  const reJitterAnchor = useCallback((id: JointId) => {
    const base = ANCHOR_BASE[id];
    setAnchorJitter((prev) => ({
      ...prev,
      [id]: {
        x: base.x + (Math.random() - 0.5) * 6,
        y: base.y + (Math.random() - 0.5) * 6,
      },
    }));
  }, []);

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const handlePieceDown = (id: JointId, e: React.MouseEvent) => {
    if (installed[id] || phase !== "assembling") return;
    const p = toSvg(e.clientX, e.clientY);
    const cur = piecePos[id];
    dragRef.current = { id, offsetX: p.x - cur.x, offsetY: p.y - cur.y };
    reJitterAnchor(id);
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const p = toSvg(e.clientX, e.clientY);
      setPiecePos((prev) => ({
        ...prev,
        [drag.id]: { x: p.x - drag.offsetX, y: p.y - drag.offsetY },
      }));
    };
    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const p = toSvg(e.clientX, e.clientY);
      const final = { x: p.x - drag.offsetX, y: p.y - drag.offsetY };
      const anchor = anchorJitter[drag.id];
      const dist = Math.hypot(final.x - anchor.x, final.y - anchor.y);

      if (dist < 18) {
        const offsetPx = dist;
        setInstalled((prev) => ({ ...prev, [drag.id]: { offsetPx } }));
        setPiecePos((prev) => ({ ...prev, [drag.id]: { ...anchor } }));
        setJointPiece(drag.id, offsetPx);
      } else {
        setPiecePos((prev) => ({ ...prev, [drag.id]: PIECE_START[drag.id] }));
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [anchorJitter, setJointPiece]);

  const allInstalled = JOINT_IDS.every((id) => installed[id]);

  useEffect(() => {
    if (allInstalled && phase === "assembling") {
      setPhase("trial");
      recomputeJoints();
    }
  }, [allInstalled, phase, recomputeJoints]);

  const handleReinstall = (id: JointId) => {
    setInstalled((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPiecePos((prev) => ({ ...prev, [id]: PIECE_START[id] }));
    setPhase("assembling");
  };

  const handleConfirmAssembly = () => {
    const overallQ = puppet?.joints.overallQuality ?? 0;
    const grade = qualityToGrade(overallQ);
    if (shouldOfferRetry(grade)) {
      setPendingRetry({ grade });
    } else {
      setPhase("done");
      onAllDone(grade);
    }
  };

  const handleRetryAll = () => {
    setInstalled({});
    setPiecePos({ ...PIECE_START });
    setPhase("assembling");
    setPendingRetry(null);
  };

  const handleAcceptCurrent = () => {
    if (!pendingRetry) return;
    setPhase("done");
    onAllDone(pendingRetry.grade);
    setPendingRetry(null);
  };

  // Trial-pull animation phase 0..3 → arm swing schedule
  const [trialPhase, setTrialPhase] = useState(0);
  useEffect(() => {
    if (phase !== "trial") return;
    const t = setInterval(() => {
      setTrialPhase((p) => (p + 1) % 4);
    }, 600);
    return () => clearInterval(t);
  }, [phase]);

  const armRot =
    trialPhase === 0 ? 0 : trialPhase === 1 ? -30 : trialPhase === 2 ? 0 : 30;

  // Re-render every 100ms while in trial phase so bad joints visibly jitter
  const [jitterTick, setJitterTick] = useState(0);
  useEffect(() => {
    if (phase !== "trial") return;
    const t = setInterval(() => setJitterTick((v) => v + 1), 100);
    return () => clearInterval(t);
  }, [phase]);
  void jitterTick;

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
        >
          <rect x="20" y="20" width="360" height="260" fill="#F4E5C0" stroke="#7A2E18" strokeWidth="2" />

          {/* 躯干 */}
          <path
            d="M180 80 Q200 70 220 80 L228 220 Q200 234 172 220 Z"
            fill="#7A2E18"
            opacity="0.55"
          />

          {/* 穿孔(目标) */}
          {phase === "assembling" &&
            JOINT_IDS.filter((id) => !installed[id]).map((id) => {
              const a = anchorJitter[id];
              const isDragging = dragRef.current?.id === id;
              const piece = piecePos[id];
              const dist = Math.hypot(piece.x - a.x, piece.y - a.y);
              const close = isDragging && dist < 8;
              return (
                <circle
                  key={`hole-${id}`}
                  cx={a.x}
                  cy={a.y}
                  r="6"
                  fill="none"
                  stroke={close ? "#D99A2B" : "#3a2412"}
                  strokeWidth={close ? 2.5 : 1.5}
                />
              );
            })}

          {/* 已装部件 */}
          {JOINT_IDS.filter((id) => installed[id]).map((id) => {
            const a = ANCHOR_BASE[id];
            const off = installed[id]!.offsetPx;
            const trialJitter =
              phase === "trial" && off > 3
                ? Math.sin(performance.now() / 80 + a.x) * Math.min(2, off * 0.4)
                : 0;
            const rot =
              phase === "trial" && (id === "leftArm" || id === "rightArm")
                ? id === "leftArm"
                  ? armRot
                  : -armRot
                : 0;
            return (
              <g
                key={id}
                style={{
                  transform: `translate(${trialJitter}px, 0) rotate(${rot}deg)`,
                  transformOrigin: `${a.x}px ${a.y}px`,
                  transition: "transform 0.4s ease",
                }}
              >
                <circle cx={a.x} cy={a.y} r="5" fill="#D99A2B" stroke="#3a2412" strokeWidth="1.2" />
                <text x={a.x} y={a.y + 18} textAnchor="middle" fontSize="10" fill="#3a2412">
                  {PIECE_LABEL[id]}
                </text>
              </g>
            );
          })}

          {/* 待装部件(可拖) */}
          {phase === "assembling" &&
            JOINT_IDS.filter((id) => !installed[id]).map((id) => {
              const p = piecePos[id];
              return (
                <g
                  key={id}
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => handlePieceDown(id, e)}
                >
                  <circle cx={p.x} cy={p.y} r="10" fill="#D99A2B" stroke="#7A2E18" strokeWidth="1.5" />
                  <circle cx={p.x} cy={p.y} r="3" fill="#3a2412" />
                  <text x={p.x} y={p.y + 24} textAnchor="middle" fontSize="11" fill="#7A2E18">
                    {PIECE_LABEL[id]}
                  </text>
                </g>
              );
            })}
        </svg>

        {pendingRetry && (
          <div className="absolute inset-0 grid place-items-center bg-[#120B08]/80 backdrop-blur-sm">
            <div className="rounded-2xl border border-[#D99A2B]/40 bg-[#1C100B] p-6 text-center max-w-[320px]">
              <p
                className="font-serif text-2xl"
                style={{ color: GRADE_META[pendingRetry.grade].color }}
              >
                关节 · {GRADE_META[pendingRetry.grade].label}
              </p>
              <p className="mt-2 text-sm text-[#F4E5C0]/70">
                {GRADE_META[pendingRetry.grade].flavor}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetryAll}
                  className="flex-1 rounded-full bg-[#D99A2B] py-2 text-sm font-semibold text-[#120B08]"
                >
                  整套重装
                </button>
                <button
                  type="button"
                  onClick={handleAcceptCurrent}
                  className="flex-1 rounded-full border border-[#F4E5C0]/30 py-2 text-sm text-[#F4E5C0]"
                >
                  接受 · 继续
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {phase === "assembling" && (
        <p className="text-center text-sm text-[#D99A2B]">
          拖动金色部件,把铜钉对准躯干上的深色穿孔(8 px 内会有金色提示)
        </p>
      )}

      {phase === "trial" && (
        <div className="space-y-3">
          <p className="text-center text-sm text-[#D99A2B]">
            试拉中 — 偏差 &gt; 3 px 的关节会肉眼可见地抖
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {JOINT_IDS.map((id) => {
              const inst = installed[id];
              const off = inst?.offsetPx ?? 0;
              const bad = off > 3;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleReinstall(id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
                    bad
                      ? "border-[#B3261E]/60 bg-[#B3261E]/15 text-[#F4E5C0]"
                      : "border-[#D99A2B]/40 text-[#D99A2B]",
                  )}
                >
                  {!bad && <Check className="h-3 w-3" />}
                  {bad && <RotateCcw className="h-3 w-3" />}
                  {PIECE_LABEL[id]} · {off.toFixed(1)} px
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleConfirmAssembly}
            className="block w-full rounded-full bg-[#D99A2B] py-3 text-sm font-semibold text-[#120B08]"
          >
            确认装配 · 下一步
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[#F4E5C0]/10 bg-[#1C100B]/50 p-4 text-xs leading-6 text-[#F4E5C0]/60">
        <strong className="text-[#D99A2B]">工艺知识</strong>:皮影以铜钉或丝线串联关节,典型影人有 11~13 个关节,由主杆控身形,手杆控手臂。
      </div>
    </div>
  );
}
