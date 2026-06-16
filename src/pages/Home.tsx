import { Link } from "react-router-dom";
import { ArrowRight, Camera, Hammer, Palette, Scissors, Sparkles } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ProgressRail } from "@/components/ProgressRail";
import { workshopSteps } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";

const craftIcons = [Hammer, Scissors, Palette, Sparkles];

export default function Home() {
  const completedSteps = useGameStore((state) => state.completedSteps);

  return (
    <GameShell>
      <section className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-[#D99A2B]/35 bg-[#D99A2B]/10 px-4 py-2 text-sm text-[#D99A2B]">
            从一张皮，到一出戏
          </p>
          <h1 className="max-w-3xl font-serif text-5xl font-black leading-tight text-[#F4E5C0] md:text-7xl">
            亲手做一尊皮影，在幕后演一出三打白骨精
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F4E5C0]/72">
            选择角色，完成制皮、雕刻、上色、装关节，再用摄像头或键鼠双手操纵影偶。最后切到幕前，观看自己刚刚演出的光影。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/roles"
              className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-6 py-3 font-semibold text-[#120B08] shadow-[0_18px_48px_rgba(217,154,43,0.28)] transition hover:-translate-y-1"
            >
              选择角色
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/sources"
              className="inline-flex items-center gap-2 rounded-full border border-[#F4E5C0]/18 px-6 py-3 font-semibold text-[#F4E5C0] transition hover:bg-[#F4E5C0]/10"
            >
              查看非遗依据
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[3rem] bg-[#D99A2B]/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[3rem] border border-[#D99A2B]/25 bg-[#1C100B]/78 p-6 shadow-2xl">
            <div className="rounded-[2rem] bg-[#F4E5C0] p-6 text-[#120B08] shadow-[inset_0_0_70px_rgba(122,46,24,0.28)]">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-[#7A2E18] px-4 py-2 text-sm text-[#F4E5C0]">幕前预览</span>
                <Camera className="h-5 w-5 text-[#7A2E18]" />
              </div>
              <div className="relative h-80 overflow-hidden rounded-[1.6rem] bg-[radial-gradient(circle_at_50%_40%,#fff4c8,#e7c98f_48%,#7a2e18)]">
                <div className="absolute left-[18%] top-[28%] h-44 w-24 rotate-[-8deg] rounded-[48%_52%_48%_52%] bg-[#120B08]/78 shadow-[0_18px_40px_rgba(18,11,8,0.36)]" />
                <div className="absolute left-[52%] top-[20%] h-52 w-28 rotate-[10deg] rounded-[52%_48%_45%_55%] bg-[#120B08]/82 shadow-[0_18px_44px_rgba(18,11,8,0.36)]" />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#120B08]/55 to-transparent" />
                <p className="absolute bottom-6 left-6 max-w-xs font-serif text-2xl font-bold text-[#F4E5C0]">
                  幕布一亮，刚才的练习就成了自己的戏。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProgressRail completedSteps={completedSteps} />

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {workshopSteps.map((step, index) => {
          const Icon = craftIcons[index];
          return (
            <article key={step.id} className="rounded-[1.6rem] border border-[#D99A2B]/18 bg-[#1C100B]/70 p-5">
              <Icon className="mb-4 h-7 w-7 text-[#D99A2B]" />
              <h2 className="font-serif text-xl text-[#F4E5C0]">{step.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#F4E5C0]/62">{step.craftNote}</p>
            </article>
          );
        })}
      </section>
    </GameShell>
  );
}
