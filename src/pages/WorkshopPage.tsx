import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ProgressRail } from "@/components/ProgressRail";
import { ShadowPuppet } from "@/components/ShadowPuppet";
import { roles, workshopSteps, defaultPose } from "@/data/gameData";
import { cn } from "@/lib/utils";
import { useGameStore, useWorkshopProgress } from "@/store/gameStore";
import { createEmptyPuppet, CARVE_REGION_IDS, JOINT_IDS } from "@/types/puppet";
import type { RoleId } from "@/types/game";

export function WorkshopPage() {
  const params = useParams();
  const puppet = useGameStore((state) => state.puppet);
  const initPuppet = useGameStore((state) => state.initPuppet);
  const setLeather = useGameStore((state) => state.setLeatherTranslucency);
  const setCarveRegion = useGameStore((state) => state.setCarveRegion);
  const recomputeCarving = useGameStore((state) => state.recomputeCarvingGrade);
  const updateColoring = useGameStore((state) => state.updateColoring);
  const setJointPiece = useGameStore((state) => state.setJointPiece);
  const recomputeJoints = useGameStore((state) => state.recomputeJointsGrade);
  const progress = useWorkshopProgress();

  const roleIdFromUrl = (params.roleId as RoleId | undefined) ?? "wukong";

  useEffect(() => {
    if (!puppet || puppet.roleId !== roleIdFromUrl) {
      initPuppet(roleIdFromUrl);
    }
  }, [puppet, roleIdFromUrl, initPuppet]);

  const activePuppet = puppet ?? createEmptyPuppet(roleIdFromUrl);
  const role = roles.find((r) => r.id === activePuppet.roleId) ?? roles[0];

  // ===== M1 临时迷你游戏(后续 Task 12~14 替换) =====
  const [leatherClicked, setLeatherClicked] = useState(0);

  const handleLeatherTick = useCallback(() => {
    const next = leatherClicked + 1;
    setLeatherClicked(next);
    if (next >= 12) {
      setLeather(0.85);
    }
  }, [leatherClicked, setLeather]);

  const handleCarveAll = useCallback(() => {
    for (const id of CARVE_REGION_IDS) {
      setCarveRegion(id, { carved: true, quality: 0.7 });
    }
    recomputeCarving();
  }, [setCarveRegion, recomputeCarving]);

  const handleColorPreset = useCallback(() => {
    updateColoring("robe", role.color);
    updateColoring("prop", role.accent);
    updateColoring("head", "#F4E5C0");
    updateColoring("face", "#F4E5C0");
    updateColoring("sash", "#D99A2B");
  }, [role, updateColoring]);

  const handleJointAllPerfect = useCallback(() => {
    for (const id of JOINT_IDS) {
      setJointPiece(id, 0);
    }
    recomputeJoints();
  }, [setJointPiece, recomputeJoints]);

  const allDone = progress.completedCount >= 4;

  return (
    <GameShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">
            第二步 · 工坊
          </p>
          <h1 className="font-serif text-4xl font-black text-[#F4E5C0] sm:text-5xl">
            为 {role.name} 制作可动皮影
          </h1>
        </div>
        <Link
          to={`/rehearsal/${role.id}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
            allDone
              ? "bg-[#D99A2B] text-[#120B08] hover:-translate-y-0.5"
              : "border border-[#F4E5C0]/16 text-[#F4E5C0]/40 pointer-events-none",
          )}
        >
          进入排练
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ProgressRail progress={progress} />

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          {workshopSteps.map((step) => {
            const done = progress[step.id];
            const isActive = progress.activeStep === step.id;
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
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {done && (
                        <Check className="h-4 w-4 flex-shrink-0 text-[#D99A2B]" />
                      )}
                      <h2 className="font-serif text-2xl text-[#F4E5C0]">
                        {step.name}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-[#F4E5C0]/60">
                      {step.craftNote}
                    </p>
                    <p className="mt-2 text-sm text-[#D99A2B]">
                      {step.gameGoal}
                    </p>
                  </div>
                </div>

                {isActive && !done && (
                  <div className="mt-4 border-t border-[#F4E5C0]/8 pt-4">
                    {step.id === "leather" && (
                      <div className="space-y-2">
                        <p className="text-sm text-[#F4E5C0]/70">
                          (M1 占位)点击 12 次模拟绷钉:已点 {leatherClicked} / 12
                        </p>
                        <button
                          type="button"
                          onClick={handleLeatherTick}
                          className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                        >
                          绷一钉
                        </button>
                      </div>
                    )}
                    {step.id === "carving" && (
                      <button
                        type="button"
                        onClick={handleCarveAll}
                        className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                      >
                        (M1 占位)一键完成雕刻
                      </button>
                    )}
                    {step.id === "coloring" && (
                      <button
                        type="button"
                        onClick={handleColorPreset}
                        className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                      >
                        (M1 占位)套用角色配色
                      </button>
                    )}
                    {step.id === "jointing" && (
                      <button
                        type="button"
                        onClick={handleJointAllPerfect}
                        className="rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08]"
                      >
                        (M1 占位)一键完成装关节
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <aside className="sticky top-6 h-fit">
          <ShadowPuppet
            asset={activePuppet}
            pose={defaultPose}
            view="backstage"
            showCarvingHints={progress.activeStep === "carving"}
          />
          <p className="mt-4 text-sm leading-6 text-[#F4E5C0]/58">
            每完成一步,影偶都会更接近可演状态。装好关节后,你会在幕后学习如何把它「活」起来。
          </p>
          {allDone && (
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
