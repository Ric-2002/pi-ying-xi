import { useEffect, useMemo, useRef, useState } from "react";
import { scriptActions } from "@/data/gameData";
import type { PuppetPoseData, ScriptActionData } from "@/types/game";

interface UseScriptTimelineResult {
  elapsedMs: number;
  durationMs: number;
  activeCue: ScriptActionData;
  progress: number;
  isFinished: boolean;
  scorePose: (pose: PuppetPoseData) => number;
}

function poseDistance(a: PuppetPoseData, b: PuppetPoseData) {
  return (
    Math.abs(a.body.x - b.body.x) +
    Math.abs(a.body.y - b.body.y) +
    Math.abs(a.body.rotation - b.body.rotation) +
    Math.abs(a.leftArm.rotation - b.leftArm.rotation) +
    Math.abs(a.rightArm.rotation - b.rightArm.rotation) +
    Math.abs(a.head.rotation - b.head.rotation) +
    Math.abs(a.prop.rotation - b.prop.rotation)
  );
}

/**
 * 驱动《三打白骨精》短剧时间轴，并把实时姿态转换为动作匹配分。
 */
export function useScriptTimeline(isRunning: boolean): UseScriptTimelineResult {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const durationMs = scriptActions[scriptActions.length - 1]?.endMs ?? 1;

  useEffect(() => {
    if (!isRunning) {
      startedAtRef.current = null;
      return undefined;
    }

    let frameId = 0;
    const tick = (time: number) => {
      if (startedAtRef.current === null) {
        startedAtRef.current = time - elapsedMs;
      }
      setElapsedMs(Math.min(time - startedAtRef.current, durationMs));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, elapsedMs, isRunning]);

  const activeCue = useMemo(
    () => scriptActions.find((cue) => elapsedMs >= cue.startMs && elapsedMs < cue.endMs) ?? scriptActions[scriptActions.length - 1],
    [elapsedMs],
  );

  const scorePose = (pose: PuppetPoseData) => {
    const distance = poseDistance(pose, activeCue.targetPose);
    return Math.max(0, Math.round(100 - distance / activeCue.tolerance));
  };

  return {
    elapsedMs,
    durationMs,
    activeCue,
    progress: Math.min(100, (elapsedMs / durationMs) * 100),
    isFinished: elapsedMs >= durationMs,
    scorePose,
  };
}
