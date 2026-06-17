import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { ProgressRail } from "@/components/ProgressRail";
import { workshopSteps } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";

// 孙悟空 SVG 皮影剪影 — 头冠 + 面谱 + 金箍棒轮廓
function WukongSilhouette() {
  return (
    <svg
      viewBox="0 0 120 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full drop-shadow-[0_18px_40px_rgba(18,11,8,0.55)]"
      aria-label="孙悟空皮影剪影"
    >
      {/* 金箍棒 — 道具横贯 */}
      <line x1="8" y1="148" x2="112" y2="112" stroke="#120B08" strokeWidth="5" strokeLinecap="round" />
      <rect x="6" y="143" width="14" height="8" rx="3" fill="#120B08" />
      <rect x="100" y="107" width="14" height="8" rx="3" fill="#120B08" />

      {/* 身体轮廓 */}
      <path
        d="M44 118 C38 118 32 124 30 134 L26 178 C24 186 28 192 36 194 L84 194 C92 192 96 186 94 178 L90 134 C88 124 82 118 76 118 Z"
        fill="#120B08"
      />
      {/* 袍服镂空纹样 */}
      <path
        d="M46 138 C50 134 56 134 60 138 C64 134 70 134 74 138"
        stroke="#D99A2B"
        strokeWidth="1.2"
        strokeDasharray="3 2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M42 152 L50 148 L60 152 L70 148 L78 152"
        stroke="#D99A2B"
        strokeWidth="1"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.6"
      />
      {/* 腰带 */}
      <rect x="36" y="162" width="48" height="5" rx="2" fill="#7A2E18" opacity="0.8" />

      {/* 左臂 */}
      <path d="M44 122 C36 126 28 138 26 148 C24 155 28 160 34 158 C40 156 44 144 48 132 Z" fill="#120B08" />
      {/* 右臂（持棒姿势，上举） */}
      <path d="M76 122 C84 118 96 112 100 106 C104 100 100 94 96 96 C90 100 82 112 76 126 Z" fill="#120B08" />

      {/* 头部 */}
      <ellipse cx="60" cy="95" rx="22" ry="24" fill="#120B08" />
      {/* 面谱镂空线 — 眼眶 */}
      <path
        d="M48 90 C50 86 56 85 58 89"
        stroke="#D99A2B"
        strokeWidth="1.2"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M62 89 C64 85 70 86 72 90"
        stroke="#D99A2B"
        strokeWidth="1.2"
        fill="none"
        opacity="0.75"
      />
      {/* 鼻梁线 */}
      <path d="M60 92 L60 100" stroke="#D99A2B" strokeWidth="1" opacity="0.5" />
      {/* 嘴部弧线 */}
      <path d="M53 104 C57 108 63 108 67 104" stroke="#D99A2B" strokeWidth="1.2" fill="none" opacity="0.6" />

      {/* 头冠 — 花冠主体 */}
      <path
        d="M38 80 C38 68 44 58 60 54 C76 58 82 68 82 80"
        fill="#120B08"
      />
      {/* 头冠火焰纹 */}
      <path
        d="M52 72 C50 64 54 58 60 56 C66 58 70 64 68 72"
        fill="#120B08"
        stroke="#D99A2B"
        strokeWidth="1"
        strokeDasharray="2 1.5"
        opacity="0.8"
      />
      {/* 冠顶羽毛 */}
      <path d="M60 54 L56 40 C54 34 58 28 60 28 C62 28 66 34 64 40 Z" fill="#120B08" />
      <path d="M55 52 L48 38 C46 32 49 27 51 28 C53 29 55 36 57 42 Z" fill="#120B08" opacity="0.7" />
      <path d="M65 52 L72 38 C74 32 71 27 69 28 C67 29 65 36 63 42 Z" fill="#120B08" opacity="0.7" />
      {/* 金箍 */}
      <path
        d="M38 82 C38 79 48 76 60 76 C72 76 82 79 82 82 C82 85 72 87 60 87 C48 87 38 85 38 82 Z"
        fill="#D99A2B"
        opacity="0.9"
      />

      {/* 腿 */}
      <path d="M42 192 L38 240 C37 246 41 250 46 250 L52 250 C57 250 59 246 58 240 L54 192 Z" fill="#120B08" />
      <path d="M78 192 L82 240 C83 246 79 250 74 250 L68 250 C63 250 61 246 62 240 L66 192 Z" fill="#120B08" />
      {/* 靴子 */}
      <ellipse cx="49" cy="251" rx="11" ry="6" fill="#120B08" />
      <ellipse cx="71" cy="251" rx="11" ry="6" fill="#120B08" />

      {/* 关节点 — 肩、肘、腕 */}
      <circle cx="44" cy="122" r="3" fill="#D99A2B" opacity="0.7" />
      <circle cx="76" cy="122" r="3" fill="#D99A2B" opacity="0.7" />
      <circle cx="32" cy="148" r="2.5" fill="#D99A2B" opacity="0.6" />
      <circle cx="98" cy="108" r="2.5" fill="#D99A2B" opacity="0.6" />
    </svg>
  );
}

// 白骨精 SVG 皮影剪影 — 长袖飘带 + 骨冠
function BaiGuJingSilhouette() {
  return (
    <svg
      viewBox="0 0 110 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full drop-shadow-[0_18px_44px_rgba(18,11,8,0.55)]"
      aria-label="白骨精皮影剪影"
    >
      {/* 飘袖 — 右侧长袖向上扬 */}
      <path
        d="M72 100 C82 88 96 72 104 56 C108 46 106 38 100 36 C94 34 88 44 84 56 C78 72 74 90 72 102 Z"
        fill="#120B08"
        opacity="0.88"
      />
      {/* 飘袖镂空纹 */}
      <path
        d="M76 90 C82 80 90 68 96 56"
        stroke="#D99A2B"
        strokeWidth="1"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.55"
      />

      {/* 身体 */}
      <path
        d="M36 112 C30 112 24 118 22 128 L18 176 C16 184 20 192 28 194 L78 194 C86 192 90 184 88 176 L84 128 C82 118 76 112 70 112 Z"
        fill="#120B08"
      />
      {/* 长裙延伸 */}
      <path
        d="M24 180 C20 190 18 210 20 230 C22 240 26 248 32 252 L74 252 C80 248 84 240 86 230 C88 210 86 190 82 180 Z"
        fill="#120B08"
        opacity="0.9"
      />
      {/* 裙摆流动纹 */}
      <path
        d="M28 200 C36 196 44 200 52 196 C60 200 68 196 78 200"
        stroke="#D99A2B"
        strokeWidth="1"
        strokeDasharray="3 2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M26 218 C34 214 42 218 52 214 C62 218 70 214 80 218"
        stroke="#D99A2B"
        strokeWidth="1"
        strokeDasharray="3 2"
        fill="none"
        opacity="0.45"
      />
      {/* 腰饰 */}
      <path
        d="M28 162 C36 158 44 162 52 158 C60 162 68 158 78 162"
        stroke="#7A2E18"
        strokeWidth="2"
        fill="none"
        opacity="0.9"
      />

      {/* 左袖 — 下垂 */}
      <path d="M36 116 C28 120 18 132 16 148 C14 158 18 164 24 162 C30 160 36 148 40 130 Z" fill="#120B08" />
      {/* 左袖飘带 */}
      <path
        d="M16 148 C10 154 8 164 12 172 C16 178 22 176 24 168"
        fill="#120B08"
        opacity="0.75"
      />

      {/* 头部 */}
      <ellipse cx="53" cy="92" rx="20" ry="22" fill="#120B08" />
      {/* 面谱 — 凤眼 */}
      <path
        d="M43 86 C45 82 51 82 54 85"
        stroke="#D99A2B"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M56 85 C59 82 65 82 67 86"
        stroke="#D99A2B"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
      />
      {/* 朱唇 */}
      <path d="M47 100 C50 104 56 104 59 100" stroke="#7A2E18" strokeWidth="1.5" fill="none" opacity="0.85" />

      {/* 骨冠 */}
      <path
        d="M33 82 C33 70 40 60 53 56 C66 60 73 70 73 82"
        fill="#120B08"
      />
      {/* 冠顶骨刺 */}
      <path d="M53 56 L51 38 C50 32 53 26 53 26 C53 26 56 32 55 38 Z" fill="#120B08" />
      <path d="M46 58 L42 42 C40 36 43 30 44 32 C46 33 48 40 49 46 Z" fill="#120B08" opacity="0.75" />
      <path d="M60 58 L64 42 C66 36 63 30 62 32 C60 33 58 40 57 46 Z" fill="#120B08" opacity="0.75" />
      {/* 冠顶骨纹 */}
      <path
        d="M40 74 C44 70 50 69 53 72 C56 69 62 70 66 74"
        stroke="#D99A2B"
        strokeWidth="1"
        strokeDasharray="2 1.5"
        fill="none"
        opacity="0.65"
      />

      {/* 关节点 */}
      <circle cx="36" cy="116" r="3" fill="#D99A2B" opacity="0.65" />
      <circle cx="70" cy="116" r="3" fill="#D99A2B" opacity="0.65" />
      <circle cx="20" cy="152" r="2.5" fill="#D99A2B" opacity="0.55" />
      <circle cx="86" cy="72" r="2.5" fill="#D99A2B" opacity="0.55" />
    </svg>
  );
}

// 工艺步骤专属 SVG 图标
function IconLeather() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7" aria-hidden="true">
      {/* 皮料轮廓 */}
      <path d="M4 10 C4 6 8 4 14 4 C20 4 24 6 24 10 L22 22 C22 24 20 25 14 25 C8 25 6 24 6 22 Z" stroke="#D99A2B" strokeWidth="1.5" fill="none" />
      {/* 皮纹 */}
      <path d="M8 13 C10 11 12 12 14 11 C16 12 18 11 20 13" stroke="#D99A2B" strokeWidth="1" strokeDasharray="2 1.5" fill="none" opacity="0.6" />
      <path d="M8 17 C10 15 12 16 14 15 C16 16 18 15 20 17" stroke="#D99A2B" strokeWidth="1" strokeDasharray="2 1.5" fill="none" opacity="0.5" />
      {/* 压平工具 */}
      <rect x="10" y="22" width="8" height="3" rx="1" fill="#D99A2B" opacity="0.7" />
    </svg>
  );
}

function IconCarving() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7" aria-hidden="true">
      {/* 刻刀 */}
      <path d="M6 22 L16 8 C17 6 20 5 22 6 L22 8 C22 8 20 8 19 10 L10 24 Z" fill="#D99A2B" opacity="0.85" />
      <path d="M22 6 L24 8 L22 10 L20 8 Z" fill="#7A2E18" />
      {/* 镂空痕迹 */}
      <path d="M8 18 C10 16 12 17 13 15" stroke="#D99A2B" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.55" />
      <circle cx="16" cy="20" r="1.5" fill="none" stroke="#D99A2B" strokeWidth="1" opacity="0.6" />
      <circle cx="20" cy="17" r="1" fill="none" stroke="#D99A2B" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function IconColoring() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7" aria-hidden="true">
      {/* 毛笔 */}
      <path d="M20 4 L22 6 L14 18 C13 20 10 22 8 22 C8 20 10 17 12 16 Z" fill="#D99A2B" opacity="0.85" />
      <path d="M20 4 L22 6 L21 8 L18 6 Z" fill="#7A2E18" />
      <path d="M8 22 C9 23 11 24 12 23 C11 22 10 21 8 22 Z" fill="#D99A2B" opacity="0.7" />
      {/* 色彩点滴 */}
      <circle cx="8" cy="14" r="2.5" fill="#7A2E18" opacity="0.7" />
      <circle cx="14" cy="22" r="1.8" fill="#D99A2B" opacity="0.65" />
      <circle cx="6" cy="19" r="1.5" fill="#365C52" opacity="0.6" />
    </svg>
  );
}

function IconJointing() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7" aria-hidden="true">
      {/* 上臂 */}
      <rect x="5" y="8" width="8" height="3.5" rx="1.5" fill="#D99A2B" opacity="0.85" />
      {/* 下臂 */}
      <rect x="15" y="16" width="8" height="3.5" rx="1.5" fill="#D99A2B" opacity="0.85" />
      {/* 关节铆钉 */}
      <circle cx="14" cy="14" r="4" stroke="#D99A2B" strokeWidth="1.5" fill="#120B08" />
      <circle cx="14" cy="14" r="2" fill="#D99A2B" opacity="0.8" />
      {/* 操纵杆 */}
      <line x1="14" y1="18" x2="14" y2="26" stroke="#F4E5C0" strokeWidth="1.2" opacity="0.5" />
      <circle cx="14" cy="26" r="1.5" fill="#F4E5C0" opacity="0.45" />
    </svg>
  );
}

const stepIcons = [IconLeather, IconCarving, IconColoring, IconJointing];

// 工艺步骤叙事排版组件 — 打破等宽等高，不等重时间轴
function WorkshopNarrative() {
  return (
    <section aria-label="制影工序流程">
      {/* 章节标题 */}
      <div className="mb-8 flex items-end gap-4">
        <h2 className="font-serif text-2xl text-[#F4E5C0]">四道工序</h2>
        <span className="mb-0.5 text-sm text-[#D99A2B]/70">从皮料到影人，一道道完成</span>
      </div>

      {/* 时间轴流程 */}
      <div className="relative">
        {/* 连接线 */}
        <div
          className="absolute left-0 right-0 top-[28px] hidden h-px md:block"
          style={{ background: "linear-gradient(90deg, transparent 0%, #D99A2B33 10%, #D99A2B55 50%, #D99A2B33 90%, transparent 100%)" }}
          aria-hidden="true"
        />

        <div className="grid gap-5 md:grid-cols-4">
          {workshopSteps.map((step, index) => {
            const Icon = stepIcons[index];
            // 第一步（制皮）视觉权重最大作为入口强调
            const isEntrance = index === 0;
            return (
              <article
                key={step.id}
                className={
                  isEntrance
                    ? "rounded-[1.6rem] border border-[#D99A2B]/35 bg-[#D99A2B]/10 p-5 shadow-[0_0_28px_rgba(217,154,43,0.12)]"
                    : "rounded-[1.6rem] border border-[#F4E5C0]/10 bg-[#1C100B]/65 p-5"
                }
              >
                {/* 步骤编号 + 图标 */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D99A2B]/25 bg-[#120B08]/60">
                    <Icon />
                  </div>
                  <span
                    className="mt-1 font-serif text-3xl font-black leading-none"
                    style={{ color: isEntrance ? "rgba(217,154,43,0.35)" : "rgba(244,229,192,0.12)" }}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* 工序名 */}
                <h3 className="font-serif text-lg text-[#F4E5C0]">{step.name}</h3>

                {/* 操作口号 */}
                <p className={`mt-1 text-sm font-medium ${isEntrance ? "text-[#D99A2B]" : "text-[#D99A2B]/65"}`}>
                  {step.actionLabel}
                </p>

                {/* 工艺说明 */}
                <p className="mt-3 text-xs leading-5 text-[#F4E5C0]/58">{step.craftNote}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const completedSteps = useGameStore((state) => state.completedSteps);
  const hasProgress = completedSteps.length > 0;
  const location = useLocation();

  return (
    <GameShell hideHeaderCta={location.pathname === "/"}>
      {/* ── 英雄区 ── */}
      <section className="grid min-h-[75vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* 左：标题 + CTA */}
        <div>
          {/* Tagline 融入排版——去掉 pill，直接作为 h1 前置行 */}
          <p className="mb-2 font-serif text-lg text-[#D99A2B]">从一张皮，到一出戏</p>
          <h1
            className="max-w-2xl font-serif text-5xl font-black leading-[1.15] text-[#F4E5C0] md:text-[4.5rem]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            亲手做一尊皮影，
            <br />
            在幕后演一出
            <span className="text-[#D99A2B]">三打白骨精</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#F4E5C0]/68">
            选好角色，依次完成制皮、雕刻、上色、装关节四道工序，
            再上幕操控影偶演出。整个流程约十分钟，全程皮影戏工艺。
          </p>

          {/* 摄像头提示 */}
          <p className="mt-3 text-xs text-[#F4E5C0]/42">
            演出环节支持摄像头手势或键鼠操控，浏览器会在进入演出时请求摄像头权限。
          </p>

          {/* CTA 按钮组 */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/roles"
              className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-6 py-3 font-semibold text-[#120B08] shadow-[0_16px_40px_rgba(217,154,43,0.30)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(217,154,43,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D99A2B]"
            >
              {hasProgress ? "继续制影" : "选择角色，开始制影"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sources"
              className="inline-flex items-center gap-2 rounded-full border border-[#F4E5C0]/20 px-6 py-3 text-sm text-[#F4E5C0]/80 transition duration-200 hover:border-[#F4E5C0]/40 hover:text-[#F4E5C0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4E5C0]/50"
            >
              非遗工艺依据
            </Link>
          </div>
        </div>

        {/* 右：皮影剪影预览卡 — 仅大屏显示 */}
        <div className="relative hidden lg:block">
          <div className="absolute -inset-8 rounded-[3rem] bg-[#D99A2B]/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[3rem] border border-[#D99A2B]/22 bg-[#1C100B]/80 p-6 shadow-2xl">
            <div className="rounded-[2rem] bg-[radial-gradient(circle_at_50%_35%,#fff4c8,#e7c98f_50%,#7a2e18_88%)] p-5 shadow-[inset_0_0_60px_rgba(122,46,24,0.30)]">
              {/* 卡片标题 */}
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-[#7A2E18]/90 px-3 py-1.5 text-xs text-[#F4E5C0]">幕后·影偶</span>
                <span className="text-xs text-[#7A2E18]/70">皮影剪纸工艺</span>
              </div>

              {/* 皮影剪影舞台 */}
              <div className="relative flex h-72 items-end justify-center gap-2 overflow-hidden rounded-[1.4rem]">
                {/* 幕布背景光晕 */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,244,200,0.35),transparent_65%)]" />

                {/* 孙悟空 — 左侧，稍大 */}
                <div
                  className="relative z-10 h-56 w-24 flex-shrink-0 animate-[puppetSway_4.2s_ease-in-out_infinite]"
                  style={{ transformOrigin: "50% 15%" }}
                >
                  <WukongSilhouette />
                </div>

                {/* 白骨精 — 右侧 */}
                <div
                  className="relative z-10 h-52 w-20 flex-shrink-0 animate-[puppetSway_3.8s_ease-in-out_0.6s_infinite]"
                  style={{ transformOrigin: "50% 15%" }}
                >
                  <BaiGuJingSilhouette />
                </div>

                {/* 底部阴影渐变 */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#120B08]/50 to-transparent" />
              </div>

              {/* 台词 */}
              <p className="mt-4 text-center font-serif text-sm text-[#7A2E18]/75">
                幕布一亮，刚才的练习就成了自己的戏。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 制影进度（仅回访用户显示） ── */}
      {hasProgress && (
        <div className="mt-10">
          <ProgressRail completedSteps={completedSteps} />
        </div>
      )}

      {/* ── 四道工序叙事排版 ── */}
      <div className="mt-14">
        <WorkshopNarrative />
      </div>

      {/* ── 移动端 sticky CTA（仅 lg 以下显示） ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#D99A2B]/15 bg-[#120B08]/92 px-5 py-3 backdrop-blur lg:hidden">
        <Link
          to="/roles"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D99A2B] py-3.5 font-semibold text-[#120B08] shadow-[0_8px_32px_rgba(217,154,43,0.35)] transition active:scale-95"
        >
          {hasProgress ? "继续制影" : "选择角色，开始制影"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {/* 移动端 sticky bar 的底部占位 */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </GameShell>
  );
}
