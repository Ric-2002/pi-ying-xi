// src/components/ShadowPuppet.tsx
import { useMemo } from "react";
import { resolveSilhouette } from "@/components/puppet/silhouettes";
import type { CarveRegionId, PuppetAsset } from "@/types/puppet";
import { CARVE_REGION_IDS } from "@/types/puppet";
import type { PuppetPoseData } from "@/types/game";

export type ShadowPuppetView = "select" | "backstage" | "stage" | "replay";

interface ShadowPuppetProps {
  asset: PuppetAsset;
  pose: PuppetPoseData;
  view: ShadowPuppetView;
  /** 工坊雕刻时是否叠加虚线提示(只在 view='backstage' + step==='carving' 时为 true) */
  showCarvingHints?: boolean;
}

// ===== 各 region 在皮影上的"开口"路径(雕了才透光) =====
const CARVE_PATHS: Record<CarveRegionId, string> = {
  face: "M44 21 Q50 18 56 21 L57 28 Q50 31 43 28 Z",
  collar: "M40 33 Q50 31 60 33 L61 36 Q50 38 39 36 Z",
  sash: "M38 47 Q50 45 62 47 L62 50 Q50 53 38 50 Z",
  skirtL: "M39 54 L46 54 L45 65 L40 65 Z",
  skirtR: "M54 54 L61 54 L60 65 L55 65 Z",
  ornament: "M48 24 L52 24 L51 27 L49 27 Z",
};

// ===== Pose 默认值(asset 不带 pose,但渲染器要兜底) =====
function safePose(p: PuppetPoseData | undefined): PuppetPoseData {
  return (
    p ?? {
      body: { x: 50, y: 58, rotation: 0 },
      leftArm: { rotation: 0 },
      rightArm: { rotation: 0 },
      head: { rotation: 0 },
      prop: { rotation: 0 },
    }
  );
}

export function ShadowPuppet({
  asset,
  pose,
  view,
  showCarvingHints = false,
}: ShadowPuppetProps) {
  const { Component: Silhouette, geometry } = resolveSilhouette(asset.roleId);
  const safe = safePose(pose);

  // 镂空层只随 asset 变,缓存以避免每帧重算(spec §5.1 风险点)
  const carveLayer = useMemo(() => {
    return CARVE_REGION_IDS.map((id) => {
      const r = asset.carving.regions[id];
      if (!r.carved) {
        // 未雕 → 实心黑(不透光的代价,spec §1.2 第 3 层)
        return (
          <path
            key={id}
            d={CARVE_PATHS[id]}
            fill="#1a0e08"
          />
        );
      }
      // 已雕 → 镂空,quality 越高边缘越清晰 + 金边
      const edgeOpacity = 0.3 + r.quality * 0.7;
      return (
        <g key={id}>
          <path d={CARVE_PATHS[id]} fill="none" />
          <path
            d={CARVE_PATHS[id]}
            fill="none"
            stroke="#3a2412"
            strokeWidth={1 - r.quality * 0.5}
            opacity={edgeOpacity}
          />
          {r.quality > 0.85 && (
            <path
              d={CARVE_PATHS[id]}
              fill="none"
              stroke="#D99A2B"
              strokeWidth={0.4}
              opacity={0.6}
            />
          )}
        </g>
      );
    });
  }, [asset.carving.regions]);

  // 雕刻提示虚线层(工坊雕刻时叠加)
  const hintLayer = useMemo(() => {
    if (!showCarvingHints) return null;
    return CARVE_REGION_IDS.map((id) => {
      const r = asset.carving.regions[id];
      if (r.carved) return null;
      return (
        <path
          key={`hint-${id}`}
          d={CARVE_PATHS[id]}
          fill="none"
          stroke="#B3261E"
          strokeWidth={0.6}
          strokeDasharray="2 1.5"
          opacity={0.6}
        />
      );
    });
  }, [showCarvingHints, asset.carving.regions]);

  // 关节抖动幅度 — offsetPx 越大抖得越凶
  const jitterFor = (jointId: keyof PuppetAsset["joints"]["pieces"]) => {
    const off = asset.joints.pieces[jointId].offsetPx;
    if (off <= 1) return 0;
    if (view !== "stage") return 0; // 只在演出时显抖,选角/工坊静态
    return Math.min(2, off * 0.4);
  };

  // 关节动作幅度系数 — 由 joints.overallQuality 决定(spec §2.3 表)
  const armScale =
    asset.joints.overallQuality < 0.4
      ? 0.6
      : asset.joints.overallQuality < 0.65
      ? 0.8
      : asset.joints.overallQuality < 0.85
      ? 1.0
      : 1.1;

  // 视图相关样式
  const viewBg =
    view === "stage" || view === "replay"
      ? "bg-[#F4E5C0]/80"
      : "bg-[#F4E5C0]/90";

  // 通透度 — 制皮 translucency + view 调整
  const baseOpacity = 0.55 + asset.leather.translucency * 0.4;
  const finalOpacity = view === "select" ? 0.85 : baseOpacity;

  return (
    <div
      className={`relative h-full min-h-[360px] w-full overflow-hidden rounded-[2rem] border border-[#D99A2B]/20 ${viewBg} shadow-[inset_0_0_80px_rgba(122,46,24,0.18)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,246,210,0.9),rgba(244,229,192,0.62)_42%,rgba(93,39,24,0.28))]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <filter
            id="puppet-shadow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feDropShadow
              dx="2"
              dy="5"
              stdDeviation="3"
              floodColor="#120B08"
              floodOpacity="0.45"
            />
          </filter>
        </defs>

        <g
          style={{
            transform: `translate(${safe.body.x - 50}px, ${
              safe.body.y - 58
            }px) rotate(${safe.body.rotation}deg)`,
            transformOrigin: "50px 58px",
            opacity: finalOpacity,
            transition: "opacity 0.4s ease",
          }}
          filter="url(#puppet-shadow)"
        >
          {/* Layer 1: 基础轮廓(由 silhouette 定义) */}
          <Silhouette />

          {/* Layer 2: 上色 — 用 coloring 填充躯干 */}
          <path
            d={geometry.torso.d}
            fill={asset.coloring.robe || "#C0442D"}
            stroke="#3A302A"
            strokeWidth="1.5"
            opacity={0.92}
          />
          <ellipse
            cx={geometry.head.cx}
            cy={geometry.head.cy}
            rx={geometry.head.rx}
            ry={geometry.head.ry}
            fill={asset.coloring.face || "#F4E5C0"}
            stroke="#3A302A"
            strokeWidth="1.2"
          />

          {/* Layer 3: 镂空 / 刀痕(asset.carving) */}
          {carveLayer}
          {hintLayer}

          {/* Layer 4 实际由 Layer 2 的 fill 已经完成,这里留空 */}

          {/* Layer 5: 关节 / 姿态 */}
          {/* Head pose wrapper — placeholder for future Layer 4 (head rotation/jitter).
              Currently a no-op because head visuals are drawn in Layer 2 above. */}
          <g
            style={{
              transform: `rotate(${safe.head.rotation}deg) translate(${jitterFor(
                "head",
              )}px, 0)`,
              transformOrigin: `${geometry.head.cx}px ${geometry.head.cy}px`,
            }}
          />
          <g
            style={{
              transform: `rotate(${
                safe.leftArm.rotation * armScale
              }deg) translate(${jitterFor("leftArm")}px, 0)`,
              transformOrigin: `${geometry.leftArmAnchor.x}px ${geometry.leftArmAnchor.y}px`,
            }}
          >
            <path
              d={`M${geometry.leftArmAnchor.x} ${geometry.leftArmAnchor.y} C31 44 25 51 23 61`}
              stroke={asset.coloring.robe || "#C0442D"}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx={geometry.leftArmAnchor.x}
              cy={geometry.leftArmAnchor.y}
              r="2.1"
              fill="#D99A2B"
              stroke="#3A302A"
              strokeWidth="0.7"
            />
          </g>
          <g
            style={{
              transform: `rotate(${
                safe.rightArm.rotation * armScale
              }deg) translate(${jitterFor("rightArm")}px, 0)`,
              transformOrigin: `${geometry.rightArmAnchor.x}px ${geometry.rightArmAnchor.y}px`,
            }}
          >
            <path
              d={`M${geometry.rightArmAnchor.x} ${geometry.rightArmAnchor.y} C70 44 76 51 78 61`}
              stroke={asset.coloring.prop || "#7A2E18"}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx={geometry.rightArmAnchor.x}
              cy={geometry.rightArmAnchor.y}
              r="2.1"
              fill="#D99A2B"
              stroke="#3A302A"
              strokeWidth="0.7"
            />
          </g>
          {/* 道具杆 */}
          <g
            style={{
              transform: `rotate(${safe.prop.rotation}deg)`,
              transformOrigin: "76px 58px",
            }}
          >
            <line
              x1="76"
              y1="28"
              x2="76"
              y2="80"
              stroke={asset.coloring.prop || "#7A2E18"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
          {/* 双腿 */}
          <path
            d={`M${geometry.leftLegAnchor.x} ${geometry.leftLegAnchor.y} L${
              geometry.leftLegAnchor.x - 6
            } 87`}
            stroke="#3A302A"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d={`M${geometry.rightLegAnchor.x} ${geometry.rightLegAnchor.y} L${
              geometry.rightLegAnchor.x + 6
            } 87`}
            stroke="#3A302A"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
