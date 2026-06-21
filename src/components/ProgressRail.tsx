// src/components/ProgressRail.tsx
import { Check } from "lucide-react";
import { workshopSteps } from "@/data/gameData";
import { cn } from "@/lib/utils";
import type { WorkshopProgress } from "@/store/gameStore";

interface ProgressRailProps {
  progress: WorkshopProgress;
}

export function ProgressRail({ progress }: ProgressRailProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-[#F4E5C0]/8 bg-[#1C100B]/50 px-4 py-3">
      {workshopSteps.map((step, idx) => {
        const done = progress[step.id];
        const isActive = progress.activeStep === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
                done
                  ? "bg-[#D99A2B]/20 text-[#D99A2B]"
                  : isActive
                  ? "bg-[#F4E5C0]/10 text-[#F4E5C0]"
                  : "text-[#F4E5C0]/40",
              )}
            >
              {done && <Check className="h-3 w-3" />}
              <span>{step.name}</span>
            </div>
            {idx < workshopSteps.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 transition",
                  done ? "bg-[#D99A2B]/40" : "bg-[#F4E5C0]/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
