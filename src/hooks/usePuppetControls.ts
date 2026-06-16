import { useCallback, useMemo, useState } from "react";
import { defaultPose } from "@/data/gameData";
import type { PuppetPoseData } from "@/types/game";

interface ControlPoint {
  x: number;
  y: number;
}

interface UsePuppetControlsResult {
  pose: PuppetPoseData;
  leftHand: ControlPoint;
  rightHand: ControlPoint;
  updateLeftHand: (point: ControlPoint) => void;
  updateRightHand: (point: ControlPoint) => void;
  nudge: (direction: "up" | "down" | "left" | "right") => void;
  reset: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pointToPose(leftHand: ControlPoint, rightHand: ControlPoint): PuppetPoseData {
  const armSpread = leftHand.x - rightHand.x;
  const lift = 100 - rightHand.y;

  return {
    body: {
      x: clamp(rightHand.x, 18, 82),
      y: clamp(rightHand.y, 28, 78),
      rotation: clamp((rightHand.x - 50) * 0.5, -24, 24),
    },
    leftArm: { rotation: clamp((leftHand.y - 48) * 1.8, -76, 76) },
    rightArm: { rotation: clamp((rightHand.y - 52) * -1.7, -78, 78) },
    head: { rotation: clamp(armSpread * 0.32, -22, 22) },
    prop: { rotation: clamp(lift - 52, -72, 72) },
  };
}

/**
 * 将左右手控制点映射为皮影姿态；摄像头不可用时同一模型复用于鼠标、键盘和触控。
 */
export function usePuppetControls(initialPose: PuppetPoseData = defaultPose): UsePuppetControlsResult {
  const [leftHand, setLeftHand] = useState<ControlPoint>({ x: 34, y: 45 });
  const [rightHand, setRightHand] = useState<ControlPoint>({ x: initialPose.body.x, y: initialPose.body.y });

  const pose = useMemo(() => pointToPose(leftHand, rightHand), [leftHand, rightHand]);

  const updateLeftHand = useCallback((point: ControlPoint) => {
    setLeftHand({ x: clamp(point.x, 0, 100), y: clamp(point.y, 0, 100) });
  }, []);

  const updateRightHand = useCallback((point: ControlPoint) => {
    setRightHand({ x: clamp(point.x, 0, 100), y: clamp(point.y, 0, 100) });
  }, []);

  const nudge = useCallback((direction: "up" | "down" | "left" | "right") => {
    setRightHand((current) => {
      const delta = 4;
      return {
        x: clamp(current.x + (direction === "right" ? delta : direction === "left" ? -delta : 0), 0, 100),
        y: clamp(current.y + (direction === "down" ? delta : direction === "up" ? -delta : 0), 0, 100),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setLeftHand({ x: 34, y: 45 });
    setRightHand({ x: initialPose.body.x, y: initialPose.body.y });
  }, [initialPose.body.x, initialPose.body.y]);

  return { pose, leftHand, rightHand, updateLeftHand, updateRightHand, nudge, reset };
}
