import { Hand } from "lucide-react";

interface ControlPoint {
  x: number;
  y: number;
}

interface ControlPadProps {
  leftHand: ControlPoint;
  rightHand: ControlPoint;
  onLeftHandChange: (point: ControlPoint) => void;
  onRightHandChange: (point: ControlPoint) => void;
}

function toPoint(event: React.PointerEvent<HTMLDivElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

/**
 * 提供双手操纵的可视化降级输入；摄像头识别失败时仍能练习主杆和手杆关系。
 */
export function ControlPad({ leftHand, rightHand, onLeftHandChange, onRightHandChange }: ControlPadProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div
        className="relative h-52 cursor-crosshair overflow-hidden rounded-[1.5rem] border border-[#1D6F7A]/35 bg-[#1D6F7A]/12"
        onPointerMove={(event) => event.buttons === 1 && onLeftHandChange(toPoint(event))}
        onPointerDown={(event) => onLeftHandChange(toPoint(event))}
      >
        <div className="absolute left-4 top-4 flex items-center gap-2 text-sm text-[#F4E5C0]/72">
          <Hand className="h-4 w-4 text-[#1D6F7A]" />
          左手：控制手杆与袖摆
        </div>
        <span
          className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F4E5C0] bg-[#1D6F7A] shadow-[0_0_28px_rgba(29,111,122,0.7)]"
          style={{ left: `${leftHand.x}%`, top: `${leftHand.y}%` }}
        />
      </div>
      <div
        className="relative h-52 cursor-crosshair overflow-hidden rounded-[1.5rem] border border-[#D99A2B]/35 bg-[#D99A2B]/12"
        onPointerMove={(event) => event.buttons === 1 && onRightHandChange(toPoint(event))}
        onPointerDown={(event) => onRightHandChange(toPoint(event))}
      >
        <div className="absolute left-4 top-4 flex items-center gap-2 text-sm text-[#F4E5C0]/72">
          <Hand className="h-4 w-4 text-[#D99A2B]" />
          右手：控制主杆与身体
        </div>
        <span
          className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#120B08] bg-[#D99A2B] shadow-[0_0_28px_rgba(217,154,43,0.75)]"
          style={{ left: `${rightHand.x}%`, top: `${rightHand.y}%` }}
        />
      </div>
    </div>
  );
}
