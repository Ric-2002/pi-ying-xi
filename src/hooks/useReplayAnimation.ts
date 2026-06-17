import { useCallback, useEffect, useRef, useState } from "react";
import { defaultPose, scriptActions, SHOW_DURATION_MS } from "@/data/gameData";
import type { PerformanceFrameData, PuppetPoseData, ScriptActionData } from "@/types/game";

interface ReplayState {
  pose: PuppetPoseData;
  progress: number;         // 0~100
  currentCue: ScriptActionData;
  isPlaying: boolean;
  isFinished: boolean;
  smokeActive: boolean;
}

interface UseReplayAnimationResult extends ReplayState {
  play: () => void;
  restart: () => void;
}

/**
 * 基于帧数组做线性插值，按时间轴重播整段演出。
 * 无帧数据时降级为静止默认姿态。
 */
export function useReplayAnimation(frames: PerformanceFrameData[]): UseReplayAnimationResult {
  const rafRef = useRef<number>(0);
  const startTsRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [pose, setPose] = useState<PuppetPoseData>(frames[frames.length - 1]?.pose ?? defaultPose);
  const [progress, setProgress] = useState(0);
  const [currentCue, setCurrentCue] = useState<ScriptActionData>(scriptActions[0]);
  const [smokeActive, setSmokeActive] = useState(false);

  // 从帧数组中按时间 t 插值出当前姿态
  const interpolatePose = useCallback((t: number): PuppetPoseData => {
    if (!frames || frames.length < 2) {
      return frames?.[0]?.pose ?? defaultPose;
    }
    // 二分查找包围帧
    let lo = 0;
    let hi = frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (frames[mid].t <= t) lo = mid;
      else hi = mid - 1;
    }
    const a = frames[lo];
    const b = frames[lo + 1] ?? a;
    const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;

    const lerp = (x: number, y: number) => x + (y - x) * k;
    return {
      body: {
        x: lerp(a.pose.body.x, b.pose.body.x),
        y: lerp(a.pose.body.y, b.pose.body.y),
        rotation: lerp(a.pose.body.rotation, b.pose.body.rotation),
      },
      leftArm: { rotation: lerp(a.pose.leftArm.rotation, b.pose.leftArm.rotation) },
      rightArm: { rotation: lerp(a.pose.rightArm.rotation, b.pose.rightArm.rotation) },
      head: { rotation: lerp(a.pose.head.rotation, b.pose.head.rotation) },
      prop: { rotation: lerp(a.pose.prop.rotation, b.pose.prop.rotation) },
    };
  }, [frames]);

  const loop = useCallback(() => {
    const elapsed = performance.now() - startTsRef.current;
    const t = Math.min(elapsed, SHOW_DURATION_MS);

    // 更新进度
    setProgress((t / SHOW_DURATION_MS) * 100);

    // 插值姿态
    setPose(interpolatePose(t));

    // 计算当前 cue
    let cue = scriptActions[0];
    for (const s of scriptActions) {
      if (t >= s.startMs) cue = s;
      else break;
    }
    setCurrentCue(cue);
    setSmokeActive(cue.smoke ?? false);

    if (elapsed >= SHOW_DURATION_MS) {
      setIsPlaying(false);
      setIsFinished(true);
      setProgress(100);
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [interpolatePose]);

  const play = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startTsRef.current = performance.now();
    setIsPlaying(true);
    setIsFinished(false);
    setProgress(0);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const restart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setIsFinished(false);
    setProgress(0);
    setSmokeActive(false);
    setPose(frames[0]?.pose ?? defaultPose);
    setCurrentCue(scriptActions[0]);
    // 重新开始
    startTsRef.current = performance.now();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [frames, loop]);

  // 组件挂载自动开始播放
  useEffect(() => {
    play();
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { pose, progress, currentCue, isPlaying, isFinished, smokeActive, play, restart };
}
