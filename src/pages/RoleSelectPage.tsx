import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { PuppetFigure } from "@/components/PuppetFigure";
import { defaultPose, roles } from "@/data/gameData";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import type { RoleId } from "@/types/game";

const difficultyText = {
  easy: "入门",
  medium: "进阶",
  hard: "挑战",
};

export function RoleSelectPage() {
  const selectedRoleId = useGameStore((state) => state.selectedRoleId);
  const selectRole = useGameStore((state) => state.selectRole);
  const resetWorkshop = useGameStore((state) => state.resetWorkshop);
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];

  const handleSelect = (roleId: RoleId) => {
    selectRole(roleId);
  };

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="mb-3 text-sm tracking-[0.4em] text-[#D99A2B]">第一步 · 选角</p>
          <h1 className="font-serif text-5xl font-black text-[#F4E5C0]">选择你要亲手制作的影人</h1>
          <p className="mt-4 text-[#F4E5C0]/68">
            每个角色会影响工坊配色、动作提示和最终剧目站位。首轮推荐选择孙悟空，能完整体验武戏动作。
          </p>
          <div className="mt-6 grid gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelect(role.id)}
                className={cn(
                  "rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5",
                  selectedRoleId === role.id
                    ? "border-[#D99A2B]/70 bg-[#D99A2B]/14"
                    : "border-[#F4E5C0]/10 bg-[#F4E5C0]/5 hover:bg-[#F4E5C0]/8",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl text-[#F4E5C0]">{role.name}</span>
                  <span className="rounded-full bg-[#120B08]/60 px-3 py-1 text-xs text-[#D99A2B]">
                    {difficultyText[role.difficulty]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#F4E5C0]/58">{role.title}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <PuppetFigure role={selectedRole} pose={defaultPose} colors={{ face: "#F4E5C0", robe: selectedRole.color, prop: selectedRole.accent }} />
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif text-3xl text-[#F4E5C0]">{selectedRole.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#F4E5C0]/64">{selectedRole.description}</p>
              <p className="mt-3 rounded-2xl border border-[#D99A2B]/16 bg-[#D99A2B]/8 p-4 text-sm leading-6 text-[#F4E5C0]/70">
                {selectedRole.culturalNote}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={resetWorkshop}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F4E5C0]/16 px-5 py-3 text-sm text-[#F4E5C0] transition hover:bg-[#F4E5C0]/10"
              >
                <RotateCcw className="h-4 w-4" />
                重置
              </button>
              <Link
                to={`/workshop/${selectedRole.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
              >
                去制作
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </GameShell>
  );
}
