import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check, Paintbrush } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ProgressRail } from "@/components/ProgressRail";
import { PuppetFigure } from "@/components/PuppetFigure";
import { roles, workshopSteps } from "@/data/gameData";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import type { RoleId, WorkshopStep } from "@/types/game";

const palette = ["#C0442D", "#D99A2B", "#1D6F7A", "#365C52", "#7A2E18", "#F4E5C0"];

export function WorkshopPage() {
  const params = useParams();
  const selectedRoleId = useGameStore((state) => state.selectedRoleId);
  const completedSteps = useGameStore((state) => state.completedSteps);
  const colors = useGameStore((state) => state.colors);
  const currentPose = useGameStore((state) => state.currentPose);
  const completeStep = useGameStore((state) => state.completeStep);
  const setColor = useGameStore((state) => state.setColor);
  const setJointQuality = useGameStore((state) => state.setJointQuality);
  const roleId = (params.roleId as RoleId | undefined) ?? selectedRoleId;
  const role = roles.find((item) => item.id === roleId) ?? roles[0];

  const handleComplete = (step: WorkshopStep) => {
    completeStep(step);
    if (step === "jointing") {
      setJointQuality(96);
    }
  };

  return (
    <GameShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">第二步 · 工坊</p>
          <h1 className="font-serif text-5xl font-black text-[#F4E5C0]">为 {role.name} 制作可动皮影</h1>
        </div>
        <Link
          to={`/rehearsal/${role.id}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
            completedSteps.length >= 4
              ? "bg-[#D99A2B] text-[#120B08] hover:-translate-y-0.5"
              : "border border-[#F4E5C0]/16 text-[#F4E5C0]/52",
          )}
        >
          进入排练
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ProgressRail completedSteps={completedSteps} />

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          {workshopSteps.map((step) => {
            const done = completedSteps.includes(step.id);
            return (
              <article
                key={step.id}
                className={cn(
                  "rounded-[1.8rem] border p-5 transition",
                  done ? "border-[#D99A2B]/50 bg-[#D99A2B]/12" : "border-[#F4E5C0]/10 bg-[#1C100B]/72",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl text-[#F4E5C0]">{step.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#F4E5C0]/62">{step.craftNote}</p>
                    <p className="mt-3 text-sm text-[#D99A2B]">{step.gameGoal}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleComplete(step.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F4E5C0] px-4 py-2 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
                  >
                    {done ? <Check className="h-4 w-4" /> : <Paintbrush className="h-4 w-4" />}
                    {done ? "已完成" : step.actionLabel}
                  </button>
                </div>
                {step.id === "coloring" && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {palette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setColor("robe", color)}
                        className="h-10 w-10 rounded-full border-2 border-[#F4E5C0]/70 shadow-lg transition hover:scale-110"
                        style={{ backgroundColor: color }}
                        aria-label={`选择颜色 ${color}`}
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <aside className="sticky top-6 h-fit rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <PuppetFigure role={role} pose={currentPose} colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }} />
          <p className="mt-4 text-sm leading-6 text-[#F4E5C0]/64">
            每完成一步，影偶都会更接近可演状态。装好关节后，你会在幕后学习如何把它“活”起来。
          </p>
        </aside>
      </section>
    </GameShell>
  );
}
