import { Link, NavLink } from "react-router-dom";
import { BookOpen, Clapperboard, Hammer, Home, RotateCcw, ScrollText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "影窗", icon: Home },
  { to: "/roles", label: "选角", icon: Sparkles },
  { to: "/workshop/wukong", label: "工坊", icon: Hammer },
  { to: "/rehearsal/wukong", label: "排练", icon: Clapperboard },
  { to: "/sources", label: "资料", icon: BookOpen },
];

interface GameShellProps {
  children: React.ReactNode;
}

/**
 * 提供统一戏台框架，让不同页面共享非遗皮影的幕布、灯影和导航氛围。
 */
export function GameShell({ children }: GameShellProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#120B08] text-[#F4E5C0]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,154,43,0.24),transparent_38%),linear-gradient(120deg,rgba(122,46,24,0.34),transparent_40%,rgba(29,111,122,0.16))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.09] [background-image:linear-gradient(90deg,#F4E5C0_1px,transparent_1px),linear-gradient(#F4E5C0_1px,transparent_1px)] [background-size:36px_36px]" />
      <header className="relative z-10 border-b border-[#D99A2B]/20 bg-[#120B08]/72 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-[#D99A2B]/50 bg-[#7A2E18]/50 shadow-[0_0_34px_rgba(217,154,43,0.25)]">
              <ScrollText className="h-5 w-5 text-[#D99A2B]" />
            </span>
            <span>
              <span className="block text-xs tracking-[0.42em] text-[#D99A2B]/80">非遗皮影网页游戏</span>
              <span className="font-serif text-xl font-semibold text-[#F4E5C0]">影幕西游</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#F4E5C0]/72 transition hover:bg-[#F4E5C0]/10 hover:text-[#F4E5C0]",
                      isActive && "bg-[#D99A2B]/18 text-[#D99A2B]",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <Link
            to="/roles"
            className="hidden rounded-full bg-[#D99A2B] px-5 py-2 text-sm font-semibold text-[#120B08] shadow-[0_12px_40px_rgba(217,154,43,0.28)] transition hover:-translate-y-0.5 hover:bg-[#F1B64B] md:inline-flex"
          >
            开始制影
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">{children}</main>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-5 right-5 z-20 rounded-full border border-[#D99A2B]/30 bg-[#120B08]/80 p-3 text-[#D99A2B] shadow-2xl backdrop-blur transition hover:-translate-y-1"
        aria-label="回到顶部"
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </div>
  );
}
