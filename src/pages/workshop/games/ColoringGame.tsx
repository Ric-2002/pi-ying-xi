// src/pages/workshop/games/ColoringGame.tsx
import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { COLOR_REGION_IDS } from "@/types/puppet";
import type { ColorRegionId } from "@/types/puppet";
import { cn } from "@/lib/utils";

const PALETTE = [
  { name: "朱砂", color: "#B3261E" },
  { name: "赭石", color: "#7A2E18" },
  { name: "藤黄", color: "#D99A2B" },
  { name: "石青", color: "#1D6F7A" },
  { name: "石绿", color: "#2F6B3E" },
  { name: "象牙白", color: "#F4E5C0" },
  { name: "烟墨", color: "#3A302A" },
  { name: "胭脂", color: "#8A1C33" },
  { name: "泥金", color: "#A8813A" },
  { name: "靛蓝", color: "#2A3E66" },
];

const REGION_LABEL: Record<ColorRegionId, string> = {
  head: "头",
  face: "脸",
  robe: "身体",
  sash: "腰带",
  prop: "道具",
};

interface ColoringGameProps {
  onDone: () => void;
}

export function ColoringGame({ onDone }: ColoringGameProps) {
  const updateColoring = useGameStore((s) => s.updateColoring);
  const puppet = useGameStore((s) => s.puppet);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color);
  const [colored, setColored] = useState<Set<ColorRegionId>>(new Set());

  const handleColor = (id: ColorRegionId) => {
    updateColoring(id, selectedColor);
    setColored((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (next.size === COLOR_REGION_IDS.length) {
        setTimeout(onDone, 400);
      }
      return next;
    });
  };

  const remaining = COLOR_REGION_IDS.length - colored.size;
  const getFill = (id: ColorRegionId) => puppet?.coloring[id] ?? "#F4E5C0";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((p) => (
          <button
            key={p.color}
            type="button"
            title={p.name}
            onClick={() => setSelectedColor(p.color)}
            className={cn(
              "h-9 w-9 rounded-full border-2 transition hover:scale-110",
              selectedColor === p.color
                ? "border-[#F4E5C0] ring-2 ring-[#D99A2B] ring-offset-1 ring-offset-[#1C100B]"
                : "border-[#5a411d]",
            )}
            style={{ backgroundColor: p.color }}
            aria-label={p.name}
          />
        ))}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#7A2E18]/40"
        style={{ background: "#F4E5C0", aspectRatio: "4/3" }}
      >
        <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
          <rect x="20" y="20" width="360" height="260" fill="#F4E5C0" stroke="#7A2E18" strokeWidth="2" />
          <ellipse
            cx="200" cy="95" rx="32" ry="38"
            fill={getFill("head")} stroke="#3a2412" strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("head")}
          />
          <path
            d="M180 90 Q200 80 220 90 Q218 115 200 120 Q182 115 180 90 Z"
            fill={getFill("face")} stroke="#3a2412" strokeWidth="1"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("face")}
          />
          <path
            d="M155 135 Q200 125 245 135 L255 245 Q200 265 145 245 Z"
            fill={getFill("robe")} stroke="#3a2412" strokeWidth="1.5"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("robe")}
          />
          <path
            d="M150 185 Q200 178 250 185 L252 200 Q200 210 148 200 Z"
            fill={getFill("sash")} stroke="#3a2412" strokeWidth="1"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("sash")}
          />
          <rect
            x="285" y="90" width="8" height="150"
            fill={getFill("prop")} stroke="#120B08"
            style={{ cursor: "pointer" }}
            onClick={() => handleColor("prop")}
          />
          <circle cx="193" cy="93" r="2.5" fill="#120B08" pointerEvents="none" />
          <circle cx="207" cy="93" r="2.5" fill="#120B08" pointerEvents="none" />
        </svg>
      </div>

      <p className="text-center text-sm text-[#D99A2B]">
        {remaining > 0
          ? `选色后点击皮影各区域上色(还剩 ${remaining} 处)`
          : "✓ 上色完成!"}
      </p>

      <div className="flex flex-wrap gap-2">
        {COLOR_REGION_IDS.map((id) => (
          <span
            key={id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              colored.has(id)
                ? "border-[#D99A2B]/50 bg-[#D99A2B]/15 text-[#D99A2B]"
                : "border-[#F4E5C0]/15 text-[#F4E5C0]/40",
            )}
          >
            {colored.has(id) ? "✓ " : ""}
            {REGION_LABEL[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
