// src/pages/StagePage.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Pause, Play, RotateCcw } from "lucide-react";
import { ControlPad } from "@/components/ControlPad";
import { GameShell } from "@/components/GameShell";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles } from "@/data/gameData";
import { usePuppetControls } from "@/hooks/usePuppetControls";
import { useScriptTimeline } from "@/hooks/useScriptTimeline";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { createEmptyPuppet } from "@/types/puppet";
import type { PerformanceFrameData, RoleId } from "@/types/game";

export function StagePage() {
  const params = useParams();
  const navigate = useNavigate();
  const puppet = useGameStore((state) => state.puppet);
  const savePerformance = useGameStore((state) => state.savePerformance);
  const roleId =
    (params.roleId as RoleId | undefined) ?? puppet?.roleId ?? "wukong";
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const asset = puppet ?? createEmptyPuppet(roleId);

  const controls = usePuppetControls();
  const [isRunning, setIsRunning] = useState(false);
  const [isFrontView, setIsFrontView] = useState(false);
  const [scoreSamples, setScoreSamples] = useState<number[]>([]);
  const framesRef = useRef<PerformanceFrameData[]>([]);
  const timeline = useScriptTimeline(isRunning);

  useEffect(() => {
    if (!isRunning || timeline.isFinished) {
      return;
    }
    const score = timeline.scorePose(controls.pose);
    setScoreSamples((samples) => [...samples.slice(-80), score]);
    framesRef.current.push({
      t: timeline.elapsedMs,
      pose: controls.pose,
      cueId: timeline.activeCue.id,
    });
  }, [controls.pose, isRunning, timeline]);

  useEffect(() => {
    if (!timeline.isFinished || framesRef.current.length === 0) {
      return;
    }
    const average = Math.round(
      scoreSamples.reduce((sum, s) => sum + s, 0) /
        Math.max(scoreSamples.length, 1),
    );
    const perf = savePerformance(framesRef.current, average);
    setIsRunning(false);
    navigate(`/replay/${perf.id}`);
  }, [navigate, savePerformance, scoreSamples, timeline.isFinished]);

  const currentScore = scoreSamples[scoreSamples.length - 1] ?? 0;

  const restart = () => {
    framesRef.current = [];
    setScoreSamples([]);
    controls.reset();
    setIsRunning(false);
  };

  const smokeActive = isRunning && (timeline.activeCue.smoke ?? false);

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.4em] text-[#D99A2B]">
                第四步 · 正式演出
              </p>
              <h1 className="mt-2 font-serif text-4xl font-black text-[#F4E5C0]">
                《三打白骨精》幕后模式
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsFrontView((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition",
                  isFrontView
                    ? "border-[#D99A2B]/40 bg-[#D99A2B]/15 text-[#D99A2B]"
                    : "border-[#F4E5C0]/16 text-[#F4E5C0]/60 hover:bg-[#F4E5C0]/5",
                )}
              >
                {isFrontView ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {isFrontView ? "幕前" : "幕后"}
              </button>
              <button
                type="button"
                onClick={() => setIsRunning((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
              >
                {isRunning ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? "暂停" : "开演"}
              </button>
              <button
                type="button"
                onClick={restart}
                className="rounded-full border border-[#F4E5C0]/16 px-4 py-3 text-[#F4E5C0] transition hover:bg-[#F4E5C0]/8"
                aria-label="重新开始"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <ShadowPuppet
              asset={asset}
              pose={controls.pose}
              view={isFrontView ? "replay" : "stage"}
            />

            <div
              className="pointer-events-none absolute inset-0 rounded-[2rem] transition-opacity duration-1000"
              style={{
                opacity: smokeActive ? 0.55 : 0,
                background:
                  "radial-gradient(circle at 50% 60%, rgba(244,229,192,0.5), transparent 60%)",
                animation: smokeActive ? "smokeDrift 3s ease-out" : "none",
              }}
            />

            {isRunning && timeline.activeCue.lyric && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
                <div className="rounded-lg bg-[#120B08]/80 px-5 py-2 text-center backdrop-blur-sm">
                  <p className="font-serif text-base tracking-widest text-[#F4E5C0]">
                    {timeline.activeCue.lyric}
                  </p>
                  <p className="mt-0.5 text-xs text-[#D99A2B]/80">
                    —— {timeline.activeCue.scene}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F4E5C0]/10">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${timeline.progress}%`,
                background: "linear-gradient(90deg, #B3261E, #D99A2B)",
              }}
            />
          </div>

          {!isFrontView && (
            <div className="mt-5">
              <ControlPad
                leftHand={controls.leftHand}
                rightHand={controls.rightHand}
                onLeftHandChange={controls.updateLeftHand}
                onRightHandChange={controls.updateRightHand}
              />
            </div>
          )}

          {isFrontView && (
            <p className="mt-4 text-center text-sm text-[#F4E5C0]/40">
              幕前视角 · 操纵杆已隐去 · 按下「幕后」可切回操纵
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-6">
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-[#F4E5C0]/10">
              <div
                className="h-full rounded-full bg-[#D99A2B] transition-all duration-200"
                style={{ width: `${timeline.progress}%` }}
              />
            </div>
            <p className="text-sm text-[#D99A2B]">{timeline.activeCue.scene}</p>
            <h2 className="mt-3 font-serif text-3xl text-[#F4E5C0]">
              {timeline.activeCue.cueText}
            </h2>
            <p className="mt-4 rounded-2xl bg-[#D99A2B]/12 p-4 text-lg font-semibold text-[#F4E5C0]">
              指引:{timeline.activeCue.instruction}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <p className="text-sm text-[#F4E5C0]/58">实时动作匹配</p>
            <p className="mt-2 font-serif text-6xl font-black text-[#D99A2B]">
              {currentScore}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#F4E5C0]/64">
              评分综合节拍、姿态和流畅度。越接近指引姿态,幕前回放越有戏曲定格感。
            </p>
          </div>

          <Link
            to={`/rehearsal/${role.id}`}
            className="block rounded-[1.5rem] border border-[#F4E5C0]/10 p-5 text-center text-sm text-[#F4E5C0]/70 transition hover:bg-[#F4E5C0]/8"
          >
            回到排练,再练一次身段
          </Link>
        </aside>
      </section>

      <style>{`
        @keyframes smokeDrift {
          0% { transform: scale(0.6) translateY(20%); }
          100% { transform: scale(1.8) translateY(-10%); }
        }
      `}</style>
    </GameShell>
  );
}
