import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

interface UseCameraPermissionResult {
  status: CameraStatus;
  stream: MediaStream | null;
  errorMessage: string;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
}

/**
 * 管理摄像头权限与资源释放，保证用户拒绝授权时仍可进入键鼠操纵降级流程。
 */
export function useCameraPermission(): UseCameraPermissionResult {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setErrorMessage("当前浏览器不支持摄像头调用，已切换为键鼠操纵。");
      return;
    }

    try {
      setStatus("requesting");
      setErrorMessage("");
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 540 } },
        audio: false,
      });
      stopCamera();
      streamRef.current = nextStream;
      setStream(nextStream);
      setStatus("granted");
    } catch {
      setStatus("denied");
      setErrorMessage("摄像头授权失败，可继续使用键盘、鼠标或触控模拟两只手。");
    }
  }, [stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  return { status, stream, errorMessage, requestCamera, stopCamera };
}
