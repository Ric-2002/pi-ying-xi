import { ExternalLink, Shield } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { sources } from "@/data/gameData";

export function SourcesPage() {
  return (
    <GameShell>
      <section className="max-w-4xl">
        <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">资料来源</p>
        <h1 className="font-serif text-5xl font-black text-[#F4E5C0]">真实非遗资料，转译为可玩的关卡</h1>
        <p className="mt-4 text-[#F4E5C0]/68">
          游戏中的制作和表演流程来自公开非遗资料的抽象设计。《三打白骨精》为经典桥段游戏化短剧，后续可接入授权剧本与地方唱腔。
        </p>
      </section>

      <section className="mt-8 grid gap-4">
        {sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="group rounded-[1.8rem] border border-[#D99A2B]/18 bg-[#1C100B]/72 p-5 transition hover:-translate-y-0.5 hover:border-[#D99A2B]/45"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[#F4E5C0]">{source.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#F4E5C0]/62">{source.summary}</p>
              </div>
              <ExternalLink className="h-5 w-5 text-[#D99A2B] transition group-hover:translate-x-1" />
            </div>
          </a>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] border border-[#1D6F7A]/30 bg-[#1D6F7A]/12 p-6">
        <div className="mb-3 flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#D99A2B]" />
          <h2 className="font-serif text-2xl text-[#F4E5C0]">摄像头隐私说明</h2>
        </div>
        <p className="text-sm leading-7 text-[#F4E5C0]/66">
          摄像头仅用于浏览器本地预览与操纵练习。当前版本不会上传视频，也不会保存原始画面；回放只保存皮影姿态、时间戳和评分。
        </p>
      </section>
    </GameShell>
  );
}
