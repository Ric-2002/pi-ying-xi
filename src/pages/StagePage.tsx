import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pause, Play, RotateCcw } from "lucide-react";
import { ControlPad } from "@/components/ControlPad";
import { GameShell } from "@/components/GameShell";
import { PuppetFigure } from "@/components/PuppetFigure";
import { roles } from "@/data/gameData";
import { usePuppetControls } from "@/hooks/usePuppetControls";
import { useScriptTimeline } from "@/hooks/useScriptTimeline";
import { useGameStore } from "@/store/gameStore";
import type { PerformanceFrameData, RoleId } from "@/types/game";

export function StagePage() {
  const params = useParams();
  const navigate = useNavigate();
  const selectedRoleId = useGameStore((state) => state.selectedRoleId);
  const colors = useGameStore((state) => state.colors);
  const savePerformance = useGameStore((state) => state.savePerformance);
  const roleId = (params.roleId as RoleId | undefined) ?? selectedRoleId;
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const controls = usePuppetControls();
  const [isRunning, setIsRunning] = useState(false);
  const [scoreSamples, setScoreSamples] = useState<number[]>([]);
  const framesRef = useRef<PerformanceFrameData[]>([]);
  const timeline = useScriptTimeline(isRunning);

  useEffect(() => {
    if (!isRunning || timeline.isFinished) {
      return;
    }

    const score = timeline.scorePose(controls.pose);
    setScoreSamples((samples) => [...samples.slice(-80), score]);
    framesRef.current.push({ t: timeline.elapsedMs, pose: controls.pose, cueId: timeline.activeCue.id });
  }, [controls.pose, isRunning, timeline]);

  useEffect(() => {
    if (!timeline.isFinished || framesRef.current.length === 0) {
      return;
    }

    const average = Math.round(scoreSamples.reduce((sum, score) => sum + score, 0) / Math.max(scoreSamples.length, 1));
    const performance = savePerformance(framesRef.current, average);
    setIsRunning(false);
    navigate(`/replay/${performance.id}`);
  }, [navigate, savePerformance, scoreSamples, timeline.isFinished]);

  const currentScore = scoreSamples[scoreSamples.length - 1] ?? 0;

  const restart = () => {
    framesRef.current = [];
    setScoreSamples([]);
    controls.reset();
    setIsRunning(false);
  };

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.4em] text-[#D99A2B]">第四步 · 正式演出</p>
              <h1 className="mt-2 font-serif text-4xl font-black text-[#F4E5C0]">《三打白骨精》幕后模式</h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRunning((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08]"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? "暂停" : "开演"}
              </button>
              <button
                type="button"
                onClick={restart}
                className="rounded-full border border-[#F4E5C0]/16 px-4 py-3 text-[#F4E5C0]"
                aria-label="重新开始"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <PuppetFigure role={role} pose={controls.pose} colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }} />

          <div className="mt-5">
            <ControlPad
              leftHand={controls.leftHand}
              rightHand={controls.rightHand}
              onLeftHandChange={controls.updateLeftHand}
              onRightHandChange={controls.updateRightHand}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-6">
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-[#F4E5C0]/10">
              <div className="h-full rounded-full bg-[#D99A2B]" style={{ width: `${timeline.progress}%` }} />
            </div>
            <p className="text-sm text-[#D99A2B]">{timeline.activeCue.scene}</p>
            <h2 className="mt-3 font-serif text-3xl text-[#F4E5C0]">{timeline.activeCue.cueText}</h2>
            <p className="mt-4 rounded-2xl bg-[#D99A2B]/12 p-4 text-lg font-semibold text-[#F4E5C0]">
              指引：{timeline.activeCue.instruction}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <p className="text-sm text-[#F4E5C0]/58">实时动作匹配</p>
            <p className="mt-2 font-serif text-6xl font-black text-[#D99A2B]">{currentScore}</p>
            <p className="mt-3 text-sm leading-6 text-[#F4E5C0]/64">
              评分综合节拍、姿态和流畅度。越接近指引姿态，幕前回放越有戏曲定格感。
            </p>
          </div>

          <Link to={`/rehearsal/${role.id}`} className="block rounded-[1.5rem] border border-[#F4E5C0]/10 p-5 text-center text-[#F4E5C0]/70 hover:bg-[#F4E5C0]/8">
            回到排练，再练一次身段
          </Link>
        </aside>
      </section>
    </GameShell>
  );
}
