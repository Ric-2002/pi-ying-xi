import { CheckCircle2 } from "lucide-react";
import { workshopSteps } from "@/data/gameData";
import { cn } from "@/lib/utils";
import type { WorkshopStep } from "@/types/game";

interface ProgressRailProps {
  completedSteps: WorkshopStep[];
}

/**
 * 展示玩家从制皮到演出的进度，强化“亲手做出皮影”的阶段感。
 */
export function ProgressRail({ completedSteps }: ProgressRailProps) {
  return (
    <section className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/72 p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-[#F4E5C0]">制影进度</h2>
        <span className="text-xs text-[#D99A2B]">{completedSteps.length}/4</span>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {workshopSteps.map((step, index) => {
          const done = completedSteps.includes(step.id);
          return (
            <div
              key={step.id}
              className={cn(
                "relative rounded-2xl border p-4 transition",
                done ? "border-[#D99A2B]/55 bg-[#D99A2B]/14" : "border-[#F4E5C0]/10 bg-[#F4E5C0]/5",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-[#F4E5C0]/45">第 {index + 1} 步</span>
                <CheckCircle2 className={cn("h-4 w-4", done ? "text-[#D99A2B]" : "text-[#F4E5C0]/18")} />
              </div>
              <p className="font-serif text-base text-[#F4E5C0]">{step.name}</p>
              <p className="mt-1 text-xs text-[#F4E5C0]/58">{step.actionLabel}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
