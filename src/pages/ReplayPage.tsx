import { Link } from "react-router-dom";
import { Home, Sparkles } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { PuppetFigure } from "@/components/PuppetFigure";
import { defaultPose, roles } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";

export function ReplayPage() {
  const performance = useGameStore((state) => state.activePerformance);
  const selectedRoleId = useGameStore((state) => state.selectedRoleId);
  const colors = useGameStore((state) => state.colors);
  const role = roles.find((item) => item.id === (performance?.roleId ?? selectedRoleId)) ?? roles[0];
  const finalFrame = performance?.frames[performance.frames.length - 1];
  const pose = finalFrame?.pose ?? defaultPose;

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm tracking-[0.4em] text-[#D99A2B]">第五步 · 幕前观看</p>
              <h1 className="mt-2 font-serif text-5xl font-black text-[#F4E5C0]">这是你刚刚演出的光影</h1>
            </div>
            <Sparkles className="h-8 w-8 text-[#D99A2B]" />
          </div>
          <PuppetFigure role={role} pose={pose} colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }} isFrontView />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#D99A2B]/12 p-6">
            <p className="text-sm text-[#D99A2B]">本场得分</p>
            <p className="mt-2 font-serif text-7xl font-black text-[#F4E5C0]">{performance?.score ?? 0}</p>
            <p className="mt-4 text-sm leading-6 text-[#F4E5C0]/70">
              你完成的不只是一个小游戏，而是从皮料、刀纹、色彩、关节到幕后身段的一次完整非遗体验。
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-6">
            <h2 className="font-serif text-2xl text-[#F4E5C0]">片尾寄语</h2>
            <p className="mt-3 text-sm leading-7 text-[#F4E5C0]/66">
              皮影戏的动人之处，是观众只看见幕前的光，幕后却藏着手、眼、唱、念和一代代人的功夫。你刚才亲手让影人动起来，也把这门手艺重新点亮了一次。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/roles"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D99A2B] px-5 py-3 text-sm font-semibold text-[#120B08]"
            >
              再做一个角色
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F4E5C0]/16 px-5 py-3 text-sm text-[#F4E5C0]"
            >
              <Home className="h-4 w-4" />
              回到影窗
            </Link>
          </div>
        </aside>
      </section>
    </GameShell>
  );
}
