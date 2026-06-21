// src/pages/ReplayPage.tsx
import { Link } from "react-router-dom";
import { Home, Play, RotateCcw } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles } from "@/data/gameData";
import { GRADE_META } from "@/data/grading";
import { useReplayAnimation } from "@/hooks/useReplayAnimation";
import { useGameStore } from "@/store/gameStore";
import { createEmptyPuppet } from "@/types/puppet";

function getScoreTier(score: number): { label: string; comment: string } {
  if (score >= 92)
    return {
      label: "天人之影",
      comment: "操纵娴熟,节奏极佳。幕前观众目眩神迷。",
    };
  if (score >= 85)
    return { label: "匠心之影", comment: "动作合度,细节可圈。这已是一场好戏。" };
  if (score >= 75)
    return { label: "匠人之影", comment: "已初具韵味,再练几番更佳。" };
  if (score >= 65)
    return { label: "学徒之影", comment: "皮影已随你心动,只是节奏需再磨。" };
  return { label: "初心之影", comment: "哪怕笨拙,这也是你独一无二的一场戏。" };
}

export function ReplayPage() {
  const performance = useGameStore((state) => state.activePerformance);
  const puppet = useGameStore((state) => state.puppet);
  const roleId = performance?.roleId ?? puppet?.roleId ?? "wukong";
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const asset = puppet ?? createEmptyPuppet(roleId);

  const frames = performance?.frames ?? [];
  const replay = useReplayAnimation(frames);
  const tier = getScoreTier(performance?.score ?? 0);

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm tracking-[0.4em] text-[#D99A2B]">
                第五步 · 幕前观看
              </p>
              <h1 className="mt-2 font-serif text-4xl font-black text-[#F4E5C0]">
                这是你刚刚演出的光影
              </h1>
            </div>
          </div>

          <div className="relative">
            <ShadowPuppet asset={asset} pose={replay.pose} view="replay" />

            <div
              className="pointer-events-none absolute inset-0 rounded-[2rem] transition-opacity duration-1000"
              style={{
                opacity: replay.smokeActive ? 0.55 : 0,
                background:
                  "radial-gradient(circle at 50% 60%, rgba(244,229,192,0.5), transparent 60%)",
                animation: replay.smokeActive ? "smokeDrift 3s ease-out" : "none",
              }}
            />

            {replay.currentCue.lyric && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
                <div className="rounded-lg bg-[#120B08]/80 px-5 py-2 text-center backdrop-blur-sm">
                  <p className="font-serif text-base tracking-widest text-[#F4E5C0]">
                    {replay.currentCue.lyric}
                  </p>
                  <p className="mt-0.5 text-xs text-[#D99A2B]/80">
                    —— {replay.currentCue.scene}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F4E5C0]/10">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${replay.progress}%`,
                background: "linear-gradient(90deg, #B3261E, #D99A2B)",
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[#F4E5C0]/40">
              幕前视角 · 操纵杆已隐去
            </p>
            <div className="flex gap-2">
              {replay.isFinished && (
                <button
                  type="button"
                  onClick={replay.restart}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#F4E5C0]/16 px-3 py-1.5 text-xs text-[#F4E5C0]/70 transition hover:bg-[#F4E5C0]/8"
                >
                  <RotateCcw className="h-3 w-3" />
                  再看一遍
                </button>
              )}
              {!replay.isPlaying && !replay.isFinished && (
                <button
                  type="button"
                  onClick={replay.play}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D99A2B] px-3 py-1.5 text-xs font-semibold text-[#120B08] transition hover:-translate-y-0.5"
                >
                  <Play className="h-3 w-3" />
                  播放
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#D99A2B]/12 p-6">
            <p className="text-sm text-[#D99A2B]">本场得分</p>
            <p className="mt-2 font-serif text-7xl font-black text-[#F4E5C0]">
              {performance?.score ?? 0}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#D99A2B]">
              {tier.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#F4E5C0]/70">
              {tier.comment}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <p className="text-sm text-[#F4E5C0]/58">你这具影人</p>
            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#F4E5C0]/70">雕刻</span>
                <span
                  className="font-serif text-lg"
                  style={{ color: GRADE_META[asset.carving.grade].color }}
                >
                  {asset.carving.grade}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#F4E5C0]/70">关节</span>
                <span
                  className="font-serif text-lg"
                  style={{ color: GRADE_META[asset.joints.grade].color }}
                >
                  {asset.joints.grade}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <h2 className="font-serif text-2xl text-[#F4E5C0]">片尾寄语</h2>
            <p className="mt-3 text-sm leading-7 text-[#F4E5C0]/66">
              皮影戏的动人之处,是观众只看见幕前的光,幕后却藏着手、眼、唱、念和一代代人的功夫。你刚才亲手让影人动起来,也把这门手艺重新点亮了一次。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/roles"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
            >
              再做一个角色
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F4E5C0]/16 px-5 py-3 text-sm text-[#F4E5C0] transition hover:bg-[#F4E5C0]/8"
            >
              <Home className="h-4 w-4" />
              回到影窗
            </Link>
          </div>
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
